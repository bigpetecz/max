import { createServer } from 'node:http';
import { createClient } from 'redis';

type DependencyStatus = 'up' | 'down';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const apiBaseUrl =
  process.env.API_INTERNAL_BASE_URL || 'http://localhost:3000/api';
const workerPort = Number(process.env.WORKER_PORT || 3001);

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
