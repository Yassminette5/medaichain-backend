import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Obtenir mes notifications' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getNotifications(
    @Request() req,
    @Query('limit') limit: number = 20,
    @Query('skip') skip: number = 0,
  ) {
    const userId = req.user?.userId ?? req.user?.sub;
    if (!userId) return [];
    return this.notificationService.getNotifications(String(userId), limit, skip);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('unread')
  @ApiOperation({ summary: 'Obtenir mes notifications non lues' })
  async getUnreadNotifications(@Request() req) {
    const userId = req.user?.userId ?? req.user?.sub;
    if (!userId) return [];
    return this.notificationService.getUnreadNotifications(String(userId));
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('unread/count')
  @ApiOperation({ summary: 'Obtenir le nombre de notifications non lues' })
  async getUnreadCount(@Request() req) {
    const userId = req.user?.userId ?? req.user?.sub;
    const count = await this.notificationService.getUnreadCount(userId);
    return { unreadCount: count };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('unread-count')
  @ApiOperation({ summary: 'Obtenir le nombre de notifications non lues (compat)' })
  async getUnreadCountCompat(@Request() req) {
    return this.getUnreadCount(req);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('read-all')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  async markAllAsRead(@Request() req) {
    const userId = req.user?.userId ?? req.user?.sub;
    if (!userId) return { modifiedCount: 0 };
    return this.notificationService.markAllAsRead(String(userId));
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une notification' })
  async deleteNotification(@Param('id') id: string) {
    return this.notificationService.deleteNotification(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete()
  @ApiOperation({ summary: 'Supprimer toutes les notifications' })
  async deleteAllNotifications(@Request() req) {
    const userId = req.user?.userId ?? req.user?.sub;
    if (!userId) return { deletedCount: 0 };
    return this.notificationService.deleteAllNotifications(String(userId));
  }
}
