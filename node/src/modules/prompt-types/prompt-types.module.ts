import { Module } from '@nestjs/common';
import { PromptTypesService } from './prompt-types.service';
import { PromptTypesController } from './prompt-types.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PromptType, PromptTypeSchema } from './entities/prompt-type.entity';
import { SystemPromptsModule } from '../system-prompts/system-prompts.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PromptType.name, schema: PromptTypeSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '24h' },
    }),
    SystemPromptsModule
  ],
  controllers: [PromptTypesController],
  providers: [PromptTypesService],
  exports: [PromptTypesService],
})
export class PromptTypesModule {}
