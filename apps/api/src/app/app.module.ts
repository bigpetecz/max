import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './google-auth.guard';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    JwtModule.register({}),
  ],
  controllers: [AppController, AuthController],
  providers: [
    AppService,
    AuthService,
    GoogleAuthGuard,
    GoogleStrategy,
    JwtStrategy,
  ],
})
export class AppModule {}
