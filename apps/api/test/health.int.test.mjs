import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import test from 'node:test';

const API_PORT = Number(process.env.API_TEST_PORT || 3300);
const HEALTH_URL = `http://127.0.0.1:${API_PORT}/api/health`;

function startProcess(command, args, env = {}) {
  return spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: 'inherit',
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

test('api health endpoint reports postgres and redis as up', async () => {
  const api = startProcess('pnpm', ['nx', 'serve', 'api'], {
    API_PORT: String(API_PORT),
    DATABASE_URL:
      process.env.DATABASE_URL || 'postgresql://max:max@localhost:5432/max',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  try {
    const payload = await waitForHealth(HEALTH_URL, 120000, api);

    assert.equal(payload.status, 'ok');
    assert.equal(payload.dependencies.postgres, 'up');
    assert.equal(payload.dependencies.redis, 'up');
  } finally {
    await stopProcess(api);
  }
});
