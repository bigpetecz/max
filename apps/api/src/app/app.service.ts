import { Injectable } from '@nestjs/common';
import { Client as PgClient } from 'pg';
import { createClient } from 'redis';

type DependencyStatus = 'up' | 'down';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return ({ message: 'Hello API' });
  }

  async getHealth() {
    const postgres = await this.checkPostgres();
    const redis = await this.checkRedis();
    const status = postgres === 'up' && redis === 'up' ? 'ok' : 'degraded';

    return {
      status,
      dependencies: {
        postgres,
        redis,
      },
    };
  }

  private async checkPostgres(): Promise<DependencyStatus> {
    const client = new PgClient({
      connectionString: process.env.DATABASE_URL,
    });

    try {
      await client.connect();
      await client.query('SELECT 1');
      return 'up';
    } catch {
      return 'down';
    } finally {
      try {
        await client.end();
      } catch {
        // no-op
      }
    }
  }

  private async checkRedis(): Promise<DependencyStatus> {
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    try {
      await client.connect();
      await client.ping();
      return 'up';
    } catch {
      return 'down';
    } finally {
      try {
        await client.quit();
      } catch {
        // no-op
      }
    }
  }
}
