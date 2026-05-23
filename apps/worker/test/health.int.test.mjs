import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import test from 'node:test';

const API_PORT = Number(process.env.API_TEST_PORT || 3300);
const WORKER_PORT = Number(process.env.WORKER_TEST_PORT || 3301);
const API_HEALTH_URL = `http://127.0.0.1:${API_PORT}/api/health`;
const WORKER_HEALTH_URL = `http://127.0.0.1:${WORKER_PORT}/health`;

function startProcess(command, args, env = {}) {
  return spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
}

function runCommand(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: 'inherit',
    });

    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`${command} ${args.join(' ')} exited with code ${code}`),
        );
      }
    });
  });
}

function stopProcess(child) {
  return new Promise((resolve) => {
    if (!child || child.killed) {
      resolve();
      return;
    }

    child.once('exit', () => resolve());
    child.kill('SIGTERM');

    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGKILL');
      }
    }, 5000).unref();
  });
}

async function waitForHealth(url, timeoutMs, child) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (child?.exitCode !== null) {
      throw new Error(
        `Process exited before health endpoint became ready: ${url}`,
      );
    }

    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // keep retrying until timeout
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for health endpoint: ${url}`);
}

test('worker health endpoint reports redis and api as up', async () => {
  await runCommand('pnpm', ['nx', 'build', 'worker']);

  const api = startProcess('pnpm', ['nx', 'serve', 'api'], {
    API_PORT: String(API_PORT),
    DATABASE_URL:
      process.env.DATABASE_URL || 'postgresql://max:max@localhost:5432/max',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  let worker;

  try {
    const apiPayload = await waitForHealth(API_HEALTH_URL, 120000, api);
    assert.equal(apiPayload.status, 'ok');

    const workerEnv = {
      ...process.env,
      WORKER_PORT: String(WORKER_PORT),
      API_INTERNAL_BASE_URL: `http://127.0.0.1:${API_PORT}/api`,
      REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    };
    delete workerEnv.DATABASE_URL;
    delete workerEnv.CREDENTIAL_KEK;

    worker = spawn('node', ['dist/apps/worker/main.js'], {
      cwd: process.cwd(),
      env: workerEnv,
      stdio: 'inherit',
    });

    const workerPayload = await waitForHealth(
      WORKER_HEALTH_URL,
      120000,
      worker,
    );
    assert.equal(workerPayload.status, 'ok');
    assert.equal(workerPayload.dependencies.redis, 'up');
    assert.equal(workerPayload.dependencies.api, 'up');
  } finally {
    if (worker) {
      await stopProcess(worker);
    }
    await stopProcess(api);
  }
});
