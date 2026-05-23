import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { AuthService } from '../src/app/auth.service';

const RUN_ID = Date.now();
const TEST_USER = {
  id: `google-sub-test-${RUN_ID}`,
  email: `sso-int-test-${RUN_ID}@example.com`,
};

function extractCookie(setCookie: string[] | undefined, cookieName: string) {
  if (!setCookie) {
    return null;
  }

  for (const value of setCookie) {
    if (value.startsWith(`${cookieName}=`)) {
      return value.split(';', 1)[0];
    }
  }

  return null;
}

describe('API integration', () => {
  let app: INestApplication;
  let authUser = {
    id: TEST_USER.id,
    email: TEST_USER.email,
  };

  beforeAll(async () => {
    process.env.DATABASE_URL =
      process.env.DATABASE_URL || 'postgresql://max:max@localhost:5432/max';
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    process.env.JWT_ACCESS_SECRET =
      process.env.JWT_ACCESS_SECRET || 'integration-test-jwt-secret';
    process.env.WEB_ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:4200';
    process.env.AUTH_TEST_MODE = 'true';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    const authService = app.get(AuthService);
    authUser = await authService.upsertGoogleUser(
      TEST_USER.id,
      TEST_USER.email,
    );
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('reports postgres and redis as up on health endpoint', async () => {
    const response = await request(app.getHttpServer()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.dependencies.postgres).toBe('up');
    expect(response.body.dependencies.redis).toBe('up');
  });

  it('issues and rotates jwt auth session via callback/refresh/logout', async () => {
    const callbackResponse = await request(app.getHttpServer())
      .get('/api/auth/google/callback')
      .query({ test_sub: authUser.id, test_email: authUser.email })
      .redirects(0);

    expect(callbackResponse.status).toBe(302);

    const initialRefreshCookie = extractCookie(
      callbackResponse.headers['set-cookie'],
      'max_refresh_token',
    );
    expect(initialRefreshCookie).toBeTruthy();

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', initialRefreshCookie as string);

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.accessToken).toBeTruthy();
    expect(refreshResponse.body.user.email).toBe(TEST_USER.email);

    const rotatedRefreshCookie = extractCookie(
      refreshResponse.headers['set-cookie'],
      'max_refresh_token',
    );
    expect(rotatedRefreshCookie).toBeTruthy();

    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${refreshResponse.body.accessToken}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.email).toBe(TEST_USER.email);

    const staleRefreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', initialRefreshCookie as string);

    expect(staleRefreshResponse.status).toBe(401);

    const logoutResponse = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', rotatedRefreshCookie as string);

    expect(logoutResponse.status).toBe(200);

    const refreshAfterLogout = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', rotatedRefreshCookie as string);

    expect(refreshAfterLogout.status).toBe(401);
  });
});
