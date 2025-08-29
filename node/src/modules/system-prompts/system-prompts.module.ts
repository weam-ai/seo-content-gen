import { Module } from '@nestjs/common';
import { SystemPromptsService } from './system-prompts.service';
import { SystemPromptsController } from './system-prompts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemPrompt, SystemPromptSchema } from './entities/system-prompt.entity';
// Removed imports for deleted modules: User, AuthTokens

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemPrompt.name, schema: SystemPromptSchema },
    ])
  ],
  controllers: [SystemPromptsController],
  providers: [SystemPromptsService],
  exports: [SystemPromptsService],
})
export class SystemPromptsModule {}
