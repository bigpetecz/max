import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, TaskStatus } from '@prisma/client';

const SBZAR_TASK_TYPE = 'sbazar.createListing';

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
  private readonly prisma = new PrismaClient();

  async createDraftTaskFromChat(
    userId: string,
    content: string,
  ): Promise<CreateDraftTaskResult> {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Message content is required');
    }

    if (!/sbazar/i.test(content)) {
      throw new BadRequestException(
        'Only Sbazar task drafts are supported right now. Mention "Sbazar" in the message.',
      );
    }

    const payload = this.toSbazarListingPayload(content);

    const task = await this.prisma.task.create({
      data: {
        userId,
        taskType: SBZAR_TASK_TYPE,
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

    return tasks.map((task) => ({
      id: task.id,
      taskType: task.taskType,
      status: task.status,
      payload: task.payloadJson,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));
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

  private toSbazarListingPayload(content: string) {
    const normalized = content.trim();
    const numericPrice = this.extractPrice(normalized);

    if (!numericPrice) {
      throw new BadRequestException(
        'Could not infer listing price from the message. Include price in CZK.',
      );
    }

    const titleCandidate = normalized
      .replace(/sbazar/gi, ' ')
      .replace(/(prodat|prodej|sell|list)\b/gi, ' ')
      .replace(/za\s*\d[\d\s.,]*\s*(k\u010d|czk)?/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const title = (titleCandidate || 'Sbazar listing').slice(0, 120);
    const description = `Auto-generated from chat request: ${normalized}`;

    return {
      title,
      price: numericPrice,
      description,
    };
  }

  private extractPrice(content: string): number | null {
    const explicitPriceMatch = content.match(
      /\bza\s*(\d[\d\s.,]*)\s*(k\u010d|czk)?\b/i,
    );
    if (explicitPriceMatch) {
      return this.toPositiveInt(explicitPriceMatch[1]);
    }

    const currencyMatches = [
      ...content.matchAll(/(\d[\d\s.,]*)\s*(k\u010d|czk)\b/gi),
    ];
    if (currencyMatches.length > 0) {
      const lastCurrency = currencyMatches[currencyMatches.length - 1];
      return this.toPositiveInt(lastCurrency?.[1] || '');
    }

    const fallbackNumbers = [...content.matchAll(/\b\d[\d\s.,]*\b/g)]
      .map((match) => this.toPositiveInt(match[0]))
      .filter((value): value is number => value !== null && value >= 100);

    if (fallbackNumbers.length === 0) {
      return null;
    }

    return fallbackNumbers[fallbackNumbers.length - 1] || null;
  }

  private toPositiveInt(value: string): number | null {
    const parsed = Number.parseInt(value.replace(/[^\d]/g, ''), 10);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }
}
