import {
  Controller,
  Get,
  Headers,
  HttpCode,
  Req,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './google-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthUser } from './auth.types';

const REFRESH_COOKIE_NAME = 'max_refresh_token';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  startGoogleLogin() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async handleGoogleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as AuthUser;
    const result = await this.authService.login(user);

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    return res.redirect(`${this.authService.webOrigin}/`);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Headers('cookie') cookieHeader: string | undefined,
    @Res() res: Response,
  ) {
    const cookies = this.authService.parseCookies(cookieHeader);
    const result = await this.authService.refresh(cookies[REFRESH_COOKIE_NAME]);

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    return res.json({ user: result.user, accessToken: result.accessToken });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Req() req: Request) {
    return { user: req.user };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Headers('cookie') cookieHeader: string | undefined,
    @Res() res: Response,
  ) {
    const cookies = this.authService.parseCookies(cookieHeader);
    await this.authService.logout(cookies[REFRESH_COOKIE_NAME]);

    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    return res.json({ ok: true });
  }
}
