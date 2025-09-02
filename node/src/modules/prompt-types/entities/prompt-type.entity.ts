import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseEntity } from '@shared/entities/basic.entity';

export type PromptTypeDocument = PromptType & Document;

@Schema({ 
  timestamps: true,
  collection: 'solution_seo_prompt_types'
})
export class PromptType extends BaseEntity {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SystemPrompt', required: true })
  titlePrompt: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SystemPrompt', required: true })
  outlinePrompt: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SystemPrompt', required: true })
  articlePrompt: Types.ObjectId;
}

export const PromptTypeSchema = SchemaFactory.createForClass(PromptType);

// Create indexes for frequently queried fields
PromptTypeSchema.index({ name: 1 });
PromptTypeSchema.index({ titlePrompt: 1 });
PromptTypeSchema.index({ outlinePrompt: 1 });
PromptTypeSchema.index({ articlePrompt: 1 });
