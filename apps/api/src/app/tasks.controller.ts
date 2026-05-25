import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthUser } from './auth.types';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Task list fetched successfully' })
  listTasks(@Req() req: Request) {
    const user = req.user as AuthUser;
    return this.tasksService.listUserTasks(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one task for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Task fetched successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  getTask(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as AuthUser;
    return this.tasksService.getUserTask(user.id, id);
  }

  @Post(':id/approve')
  @ApiOperation({
    summary: 'Approve a pending task and queue it for execution',
  })
  @ApiResponse({ status: 200, description: 'Task approved' })
  @ApiResponse({ status: 409, description: 'Task cannot be approved' })
  approveTask(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as AuthUser;
    return this.tasksService.approveUserTask(user.id, id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a draft/pending task' })
  @ApiResponse({ status: 200, description: 'Task rejected' })
  @ApiResponse({ status: 409, description: 'Task cannot be rejected' })
  rejectTask(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as AuthUser;
    return this.tasksService.rejectUserTask(user.id, id);
  }
}
