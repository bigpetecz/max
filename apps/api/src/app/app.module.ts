import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AiService } from './ai.service.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { GoogleAuthGuard } from './google-auth.guard.js';
import { GoogleStrategy } from './google.strategy.js';
import { InternalController } from './internal.controller.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { JwtStrategy } from './jwt.strategy.js';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    JwtModule.register({}),
    BullModule.forRoot({
      connection: {
        url: process.env.BULLMQ_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379',
      },
    }),
    BullModule.registerQueue({ name: 'tasks' }),
  ],
  controllers: [AppController, AuthController, ChatController, InternalController, TasksController],
  providers: [
    AppService,
    AiService,
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
