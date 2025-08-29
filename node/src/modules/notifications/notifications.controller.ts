import { Controller, Get, Post, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { successResponseWithData, successResponse } from '@shared/utils/reponses.utils';

@Controller('notifications')
export class NotificationsController {
  @Get()
  async getNotifications(@Res() res: Response) {
    // Return empty notifications array for single-user application
    return successResponseWithData(
      res,
      'Notifications fetched successfully',
      []
    );
  }

  @Post('mark-all-as-read')
  async markAllNotificationsAsRead(@Res() res: Response) {
    // No-op for single-user application
    return successResponse(
      res,
      'All notifications marked as read'
    );
  }

  @Post(':id/mark-as-read')
  async markNotificationAsRead(@Param('id') id: string, @Res() res: Response) {
    // No-op for single-user application
    return successResponse(
      res,
      'Notification marked as read'
    );
  }

  @Get('unread-count')
  async getUnreadNotificationsCount(@Res() res: Response) {
    // Always return 0 for single-user application
    return successResponseWithData(
      res,
      'Unread count fetched successfully',
      { count: 0 }
    );
  }
}