import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import type { AuthUser } from './auth.types';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly prisma = new PrismaClient();

  constructor(private readonly jwtService: JwtService) {}

  get webOrigin(): string {
    return process.env.WEB_ORIGIN || 'http://localhost:4200';
  }

  async upsertGoogleUser(googleSub: string, email: string): Promise<AuthUser> {
    const user = await this.prisma.user.upsert({
      where: { googleSub },
      update: { email },
      create: {
        googleSub,
        email,
      },
    });

    return {
      id: user.id,
      email: user.email,
    };
  }

  async login(user: AuthUser) {
    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: true,
      },
    });

    if (!session || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    await this.prisma.session.delete({ where: { id: session.id } });

    const user: AuthUser = { id: session.user.id, email: session.user.email };
    const newRefreshToken = await this.createRefreshToken(user.id);
    const accessToken = await this.signAccessToken(user);

    return {
      user,
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) {
      return;
    }

    await this.prisma.session
      .delete({
        where: {
          tokenHash: this.hashToken(refreshToken),
        },
      })
      .catch(() => {
        // no-op
      });
  }

  parseCookies(cookieHeader: string | undefined): Record<string, string> {
    if (!cookieHeader) {
      return {};
    }

    return cookieHeader
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .reduce<Record<string, string>>((acc, part) => {
        const separator = part.indexOf('=');
        if (separator < 0) {
          return acc;
        }

        const key = part.slice(0, separator);
        const value = part.slice(separator + 1);
        acc[key] = decodeURIComponent(value);
        return acc;
      }, {});
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private get jwtAccessSecret(): string {
    const value = process.env.JWT_ACCESS_SECRET;
    if (!value) {
      throw new InternalServerErrorException('JWT_ACCESS_SECRET is missing');
    }

    return value;
  }

  private async signAccessToken(user: AuthUser) {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
      },
      {
        secret: this.jwtAccessSecret,
        expiresIn: ACCESS_TOKEN_TTL,
      },
    );
  }

  private async createRefreshToken(userId: string) {
    const refreshToken = randomBytes(32).toString('base64url');

    await this.prisma.session.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return refreshToken;
  }
}
