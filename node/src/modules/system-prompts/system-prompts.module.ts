import { Module } from '@nestjs/common';
import { SystemPromptsService } from './system-prompts.service';
import { SystemPromptsController } from './system-prompts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemPrompt, SystemPromptSchema } from './entities/system-prompt.entity';
import { JwtModule } from '@nestjs/jwt';
import { User, UserSchema } from '../users/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemPrompt.name, schema: SystemPromptSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'razorcopy',
      signOptions: { expiresIn: '24h' },
    })
  ],
  controllers: [SystemPromptsController],
  providers: [SystemPromptsService],
  exports: [SystemPromptsService],
})
export class SystemPromptsModule {}
