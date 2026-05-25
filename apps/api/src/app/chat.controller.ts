import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ChatService } from './chat.service';

type ChatRequestBody = {
  messages?: Array<{
    role?: 'system' | 'user' | 'assistant';
    content?: string;
  }>;
};

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('stream')
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
}
