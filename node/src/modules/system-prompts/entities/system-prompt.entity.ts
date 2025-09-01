import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseEntity } from '@shared/entities/basic.entity';
import { SYSTEM_PROMPT_TYPES } from '@shared/types/system-prompt.t';
import { Types } from 'mongoose';

@Schema({ collection: 'solution_seo_system_prompts', timestamps: true })
export class SystemPrompt extends BaseEntity {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(SYSTEM_PROMPT_TYPES), required: true })
  type: SYSTEM_PROMPT_TYPES;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Boolean, default: false })
  is_default?: boolean;
}

export const SystemPromptSchema = SchemaFactory.createForClass(SystemPrompt);
