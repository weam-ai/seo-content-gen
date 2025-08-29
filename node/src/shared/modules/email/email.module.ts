import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailService } from './email.service';

// @Module({
//   imports: [
//     BullModule.registerQueue({
//       name: 'email',
//     }),
//   ],
//   providers: [EmailService, EmailQueueService, EmailProcessor],
//   exports: [EmailService, EmailQueueService],
// })
// export class EmailModule {}
@Module({
  imports: [
    // BullModule.registerQueue({
    //   name: 'email',
    // }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
