import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { AuthUser } from './auth.types';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  override canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();

    const testModeEnabled =
      process.env.AUTH_TEST_MODE === 'true' &&
      process.env.NODE_ENV !== 'production';
    const testSub = req.query?.test_sub;
    const testEmail = req.query?.test_email;

    if (
      testModeEnabled &&
      typeof testSub === 'string' &&
      typeof testEmail === 'string'
    ) {
      const user: AuthUser = {
        id: testSub,
        email: testEmail,
      };

      req.user = user;
      return true;
    }

    return super.canActivate(context);
  }
}
