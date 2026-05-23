import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-google-oauth20';
import { AuthService } from './auth.service';
import type { AuthUser } from './auth.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL:
        process.env.GOOGLE_REDIRECT_URI ||
        'http://localhost:3000/api/auth/google/callback',
      scope: ['openid', 'profile', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<AuthUser> {
    const googleSub = profile.id;
    const email = profile.emails?.[0]?.value;

    if (!googleSub || !email) {
      throw new UnauthorizedException(
        'Google profile is missing required data',
      );
    }

    return this.authService.upsertGoogleUser(googleSub, email);
  }
}
