import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { AuthUser } from './auth.types';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ChatService } from './chat.service';
import { TasksService } from './tasks.service';

type ChatRequestBody = {
  messages?: Array<{
    role?: 'system' | 'user' | 'assistant';
    content?: string;
  }>;
};

type ChatMessageCreateBody = {
  content?: string;
};

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly tasksService: TasksService,
  ) {}

  @Post('stream')
  @ApiOperation({ summary: 'Stream assistant response text for chat messages' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: {
                type: 'string',
                enum: ['system', 'user', 'assistant'],
              },
              content: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Text stream response' })
  @UseGuards(JwtAuthGuard)
  async streamChat(
    @Req() _req: Request,
    @Body() body: ChatRequestBody,
    @Res() res: Response,
  ) {
    const messages = (body.messages || [])
      .filter((message) => {
        return (
          (message.role === 'system' ||
            message.role === 'user' ||
            message.role === 'assistant') &&
          typeof message.content === 'string' &&
          message.content.trim().length > 0
        );
      })
      .map((message) => {
        return {
          role: message.role as 'system' | 'user' | 'assistant',
          content: message.content as string,
        };
      });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    try {
      await this.chatService.streamReply(messages, (chunk) => {
        res.write(chunk);
      });
    } catch {
      if (!res.headersSent) {
        res.status(500);
      }
      res.write('Chat stream failed.');
    } finally {
      res.end();
    }
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Convert a chat message into a validated pending-approval task draft',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['content'],
      properties: {
        content: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Task draft created from chat message',
  })
  @ApiResponse({
    status: 400,
    description: 'Message cannot be converted to task',
  })
  async createTaskDraftFromChat(
    @Req() req: Request,
    @Body() body: ChatMessageCreateBody,
  ) {
    const user = req.user as AuthUser;
    const task = await this.tasksService.createDraftTaskFromChat(
      user.id,
      body.content || '',
    );

    return {
      assistantMessage:
        'Draft task prepared. Review title, price, and description before approval.',
      task,
    };
  }
}
