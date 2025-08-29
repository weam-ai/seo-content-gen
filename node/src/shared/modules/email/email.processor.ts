// import { Processor, WorkerHost } from '@nestjs/bullmq';
// import { Injectable } from '@nestjs/common';
// import { Job } from 'bullmq';
// import { EmailService } from './email.service';
// import { logger } from '../../utils/logger.utils';
// import {
//   EMAIL_QUEUE_NAME,
//   EMAIL_TEMPLATE_QUEUE_NAME,
//   EmailJobData,
//   EmailTemplateJobData,
// } from './email-queue.service';

// @Processor('email')
// @Injectable()
// export class EmailProcessor extends WorkerHost {
//   constructor(private readonly emailService: EmailService) {
//     super();
//   }

//   async process(job: Job<EmailJobData | EmailTemplateJobData>): Promise<void> {
//     const { data } = job;

//     try {
//       if (job.name === EMAIL_QUEUE_NAME) {
//         const emailData = data as EmailJobData;

//         await this.emailService.sendMailDirect(
//           emailData.to,
//           emailData.subject,
//           emailData.text || '',
//           emailData.html,
//         );

//         logger.log(
//           'info',
//           `Email processed successfully [Job ID: ${job.id}, To: ${Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to}]`,
//         );
//       } else if (job.name === EMAIL_TEMPLATE_QUEUE_NAME) {
//         const templateData = data as EmailTemplateJobData;
//         await this.emailService.sendMailWithTemplateDirect(
//           templateData.to,
//           templateData.templateName,
//           templateData.subject,
//           templateData.data,
//         );

//         logger.log(
//           'info',
//           `Template email processed successfully [Job ID: ${job.id}, To: ${Array.isArray(templateData.to) ? templateData.to.join(', ') : templateData.to}, Template: ${templateData.templateName}]`,
//         );
//       }
//     } catch (error) {
//       logger.error(
//         `Email processing failed [Job ID: ${job.id}, Attempt: ${job.attemptsMade}/${job.opts.attempts}]:`,
//         error,
//       );

//       if (job.attemptsMade >= (job.opts.attempts || 3)) {
//         logger.error(
//           `Email job permanently failed after ${job.attemptsMade} attempts [Job ID: ${job.id}]`,
//         );
//       }

//       throw error; // Re-throw to trigger retry
//     }
//   }
// }
