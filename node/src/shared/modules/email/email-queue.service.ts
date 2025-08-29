import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { logger } from '../../utils/logger.utils';

export interface EmailJobData {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateName?: string;
  templateData?: Record<string, any>;
}

export interface EmailTemplateJobData {
  to: string | string[];
  templateName: string;
  subject: string;
  data: Record<string, any>;
}

export const EMAIL_QUEUE_NAME = `rz-${process.env.NODE_ENV}-send-email`;
export const EMAIL_TEMPLATE_QUEUE_NAME = `rz-${process.env.NODE_ENV}-send-template-email`;

@Injectable()
export class EmailQueueService {
  constructor(@InjectQueue('email') private emailQueue: Queue<EmailJobData>) {}

  async addEmailToQueue(emailData: EmailJobData): Promise<void> {
    try {
      await this.emailQueue.add(EMAIL_QUEUE_NAME, emailData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 10,
      });

      logger.log(
        'info',
        `Email job added to queue [To: ${Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to}, Subject: ${emailData.subject}]`,
      );
    } catch (error) {
      logger.error('Error adding email to queue:', error);
      throw error;
    }
  }

  async addTemplateEmailToQueue(
    emailData: EmailTemplateJobData,
  ): Promise<void> {
    try {
      await this.emailQueue.add(EMAIL_TEMPLATE_QUEUE_NAME, emailData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 10,
      });

      logger.log(
        'info',
        `Template email job added to queue (${EMAIL_QUEUE_NAME}) [To: ${Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to}, Template: ${emailData.templateName}]`,
      );
    } catch (error) {
      logger.error('Error adding template email to queue:', error);
      throw error;
    }
  }
}
