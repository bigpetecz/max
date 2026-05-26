import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaClient, TaskStatus } from '@prisma/client';
import { ZodError } from 'zod';
import { AiService } from './ai.service.js';

type CreateDraftTaskResult = {
  id: string;
  taskType: string;
  status: TaskStatus;
  payload: {
    title: string;
    price: number;
    description: string;
    imagePaths?: string[];
  };
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly prisma = new PrismaClient();

  constructor(
    private readonly aiService: AiService,
    @InjectQueue('tasks') private readonly tasksQueue: Queue,
  ) {}

  async createDraftTaskFromChat(
    userId: string,
    content: string,
  ): Promise<CreateDraftTaskResult> {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Message content is required');
    }

    let extracted;
    try {
      extracted = await this.aiService.extractTask(content);
    } catch (err) {
      this.logger.warn(`AI task extraction failed: ${String(err)}`);

      if (err instanceof ZodError) {
        throw new BadRequestException(
          `Could not extract a valid task from the message: ${err.issues.map((issue) => issue.message).join(', ')}`,
        );
      }

      throw new BadRequestException(
        'Could not extract a task from the message. Try describing the item name, price in CZK, and that you want to sell it on Sbazar.',
      );
    }

    const { payload } = extracted;

    const task = await this.prisma.task.create({
      data: {
        userId,
        taskType: extracted.taskType,
        payloadJson: payload,
        status: TaskStatus.PendingApproval,
      },
    });

    return {
      id: task.id,
      taskType: task.taskType,
      status: task.status,
      payload: payload,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  async listUserTasks(userId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map((task) => {
      const t = task as {
        id: string;
        taskType: string;
        status: TaskStatus;
        payloadJson: unknown;
        createdAt: Date;
        updatedAt: Date;
      };
      return {
        id: t.id,
        taskType: t.taskType,
        status: t.status,
        payload: t.payloadJson,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      };
    });
  }

  async getUserTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return {
      id: task.id,
      taskType: task.taskType,
      status: task.status,
      payload: task.payloadJson,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  async approveUserTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.status !== TaskStatus.PendingApproval) {
      throw new ConflictException(
        `Task cannot be approved from status ${task.status}`,
      );
    }

    const updated = await this.prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        status: TaskStatus.Queued,
      },
    });

    await this.tasksQueue.add('execute', {
      taskId: updated.id,
      userId,
      taskType: updated.taskType,
      payload: updated.payloadJson,
    });

    this.logger.log(`Task ${updated.id} (${updated.taskType}) queued for execution`);

    return {
      id: updated.id,
      status: updated.status,
    };
  }

  async rejectUserTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (
      task.status !== TaskStatus.Draft &&
      task.status !== TaskStatus.PendingApproval
    ) {
      throw new ConflictException(
        `Task cannot be rejected from status ${task.status}`,
      );
    }

    await this.prisma.task.delete({
      where: {
        id: task.id,
      },
    });

    return {
      ok: true,
      id: taskId,
    };
  }
}
