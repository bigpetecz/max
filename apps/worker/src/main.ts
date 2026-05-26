import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';
import { Worker as BullWorker } from 'bullmq';
import { createClient } from 'redis';

type DependencyStatus = 'up' | 'down';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const apiBaseUrl =
  process.env.API_INTERNAL_BASE_URL || 'http://localhost:3000/api';
const workerPort = Number(process.env.WORKER_PORT || 3001);
const hmacSecret =
  process.env.INTERNAL_HMAC_SECRET || 'dev-insecure-secret';

const forbiddenWorkerEnv = ['DATABASE_URL', 'CREDENTIAL_KEK'];
for (const envName of forbiddenWorkerEnv) {
  if (process.env[envName]) {
    console.error(`Worker must not have ${envName} in environment.`);
    process.exit(1);
  }
}

const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (error) => {
  console.error('Redis client error in worker:', error);
});

function sendJson(
  res: import('node:http').ServerResponse,
  statusCode: number,
  payload: object,
) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function patchTaskStatus(
  taskId: string,
  status: 'Running' | 'Succeeded' | 'Failed',
) {
  const body = JSON.stringify({ status });
  const sig = createHmac('sha256', hmacSecret).update(body).digest('hex');
  const response = await fetch(
    `${apiBaseUrl}/internal/tasks/${taskId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-max-signature': sig,
      },
      body,
    },
  );
  if (!response.ok) {
    throw new Error(
      `Status update failed: ${response.status} ${await response.text()}`,
    );
  }
}

type TaskJobData = {
  taskId: string;
  userId: string;
  taskType: string;
  payload: Record<string, unknown>;
};

async function handleSbazarCreateListing(data: TaskJobData) {
  console.log(
    `[worker] sbazar.createListing taskId=${data.taskId} payload=`,
    data.payload,
  );
  await patchTaskStatus(data.taskId, 'Running');
  // TODO: implement Playwright workflow via sbazar integration
  await patchTaskStatus(data.taskId, 'Succeeded');
}

async function processTask(data: TaskJobData) {
  if (data.taskType === 'sbazar.createListing') {
    await handleSbazarCreateListing(data);
  } else {
    console.warn(`[worker] Unknown taskType: ${data.taskType}`);
    await patchTaskStatus(data.taskId, 'Failed');
  }
}

async function checkApi(): Promise<DependencyStatus> {
  try {
    const response = await fetch(`${apiBaseUrl}/health`);
    if (!response.ok) {
      return 'down';
    }

    const payload = (await response.json()) as { status?: string };
    return payload.status === 'ok' || payload.status === 'degraded'
      ? 'up'
      : 'down';
  } catch {
    return 'down';
  }
}

async function checkRedis(): Promise<DependencyStatus> {
  try {
    await redisClient.ping();
    return 'up';
  } catch {
    return 'down';
  }
}

async function workerHealth() {
  const redis = await checkRedis();
  const api = await checkApi();
  return {
    status: redis === 'up' && api === 'up' ? 'ok' : 'degraded',
    dependencies: {
      redis,
      api,
    },
  };
}

async function bootstrap() {
  await redisClient.connect();

  const startupHealth = await workerHealth();
  if (
    startupHealth.dependencies.redis === 'down' ||
    startupHealth.dependencies.api === 'down'
  ) {
    console.error('Worker failed startup dependency checks:', startupHealth);
    await redisClient.quit();
    process.exit(1);
  }

  const bullWorker = new BullWorker(
    'tasks',
    async (job) => {
      console.log(`[worker] Processing job ${job.id} type=${job.name}`);
      await processTask(job.data as TaskJobData);
    },
    { connection: { url: redisUrl } },
  );

  bullWorker.on('completed', (job) =>
    console.log(`[worker] Job ${job.id} completed`),
  );
  bullWorker.on('failed', (job, err) =>
    console.error(`[worker] Job ${job?.id} failed:`, err),
  );

  const server = createServer(async (req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      const health = await workerHealth();
      sendJson(res, health.status === 'ok' ? 200 : 503, health);
      return;
    }

    sendJson(res, 404, { message: 'Not found' });
  });

  server.listen(workerPort, () => {
    console.log(
      `Worker running with health endpoint on http://localhost:${workerPort}/health`,
    );
  });

  const shutdown = async () => {
    server.close();
    await bullWorker.close();
    try {
      await redisClient.quit();
    } catch {
      // no-op
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error('Worker startup failed:', error);
  process.exit(1);
});
