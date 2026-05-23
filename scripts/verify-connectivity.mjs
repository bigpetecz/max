import { spawn } from 'node:child_process';

const apiUrl = 'http://localhost:3000/api/health';
const workerUrl = 'http://localhost:3001/health';
const timeoutMs = 120000;

function startProcess(name, command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`);
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`);
  });

  return child;
}

async function runCommand(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(
          new Error(`${command} ${args.join(' ')} exited with code ${code}`),
        );
      }
    });
  });
}

async function waitForHealth(url, name, deadlineMs) {
  while (Date.now() < deadlineMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const payload = await response.json();
        if (payload?.status === 'ok' || payload?.status === 'degraded') {
          return payload;
        }
      }
    } catch {
      // retry until timeout
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`${name} did not become healthy at ${url} within timeout`);
}

async function main() {
  const deadlineMs = Date.now() + timeoutMs;
  const children = [];

  const cleanup = () => {
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
    }
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    cleanup();
    process.exit(1);
  });

  try {
    await runCommand('pnpm', [
      'prisma',
      'migrate',
      'deploy',
      '--schema',
      'apps/api/prisma/schema.prisma',
    ]);

    const api = startProcess('api', 'pnpm', ['nx', 'serve', 'api'], {
      API_PORT: '3000',
    });
    children.push(api);

    const apiHealth = await waitForHealth(apiUrl, 'API', deadlineMs);
    if (
      apiHealth?.dependencies?.postgres !== 'up' ||
      apiHealth?.dependencies?.redis !== 'up'
    ) {
      throw new Error(
        `API dependency checks failed: ${JSON.stringify(apiHealth)}`,
      );
    }

    const worker = startProcess('worker', 'pnpm', ['nx', 'serve', 'worker'], {
      WORKER_PORT: '3001',
      API_INTERNAL_BASE_URL: 'http://localhost:3000/api',
      REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
      DATABASE_URL: '',
      CREDENTIAL_KEK: '',
    });
    children.push(worker);

    const workerHealth = await waitForHealth(workerUrl, 'Worker', deadlineMs);
    if (
      workerHealth?.dependencies?.redis !== 'up' ||
      workerHealth?.dependencies?.api !== 'up'
    ) {
      throw new Error(
        `Worker dependency checks failed: ${JSON.stringify(workerHealth)}`,
      );
    }

    console.log('Connectivity verification passed.');
    cleanup();
    process.exit(0);
  } catch (error) {
    cleanup();
    console.error(error);
    process.exit(1);
  }
}

main();
