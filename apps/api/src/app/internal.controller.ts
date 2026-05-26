import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  Logger,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PrismaClient, TaskStatus } from '@prisma/client';
import { ApiExcludeController } from '@nestjs/swagger';

type UpdateStatusBody = {
  status: 'Running' | 'Succeeded' | 'Failed';
};

@ApiExcludeController()
@Controller('internal')
export class InternalController {
  private readonly logger = new Logger(InternalController.name);
  private readonly prisma = new PrismaClient();
  private readonly hmacSecret =
    process.env.INTERNAL_HMAC_SECRET || 'dev-insecure-secret';

  @Patch('tasks/:id/status')
  async updateTaskStatus(
    @Param('id') id: string,
    @Body() body: UpdateStatusBody,
    @Headers('x-max-signature') signature: string | undefined,
  ) {
    this.verifySignature(JSON.stringify(body), signature);

    const statusMap: Partial<Record<string, TaskStatus>> = {
      Running: TaskStatus.Running,
      Succeeded: TaskStatus.Succeeded,
      Failed: TaskStatus.Failed,
    };

    const newStatus = body.status && statusMap[body.status];

    if (!newStatus) {
      throw new ForbiddenException('Invalid status transition');
    }

    const task = await this.prisma.task.findUnique({ where: { id } });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: { status: newStatus },
    });

    this.logger.log(`Task ${id} status updated to ${newStatus}`);

    return { id: updated.id, status: updated.status };
  }

  private verifySignature(
    body: string,
    signature: string | undefined,
  ): void {
    if (!signature) {
      throw new ForbiddenException('Missing signature');
    }

    const expected = createHmac('sha256', this.hmacSecret)
      .update(body)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'utf8');
    const receivedBuf = Buffer.from(signature, 'utf8');

    if (
      expectedBuf.length !== receivedBuf.length ||
      !timingSafeEqual(expectedBuf, receivedBuf)
    ) {
      throw new ForbiddenException('Invalid signature');
    }
  }
}
