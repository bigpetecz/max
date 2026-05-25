import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GoogleAuthGuard } from './google-auth.guard';
import { GoogleStrategy } from './google.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    JwtModule.register({}),
  ],
  controllers: [AppController, AuthController, ChatController, TasksController],
  providers: [
    AppService,
    AuthService,
    ChatService,
    TasksService,
    GoogleAuthGuard,
    GoogleStrategy,
    JwtAuthGuard,
    JwtStrategy,
  ],
})
export class AppModule {}
