import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GuidelineDocument = Guideline & Document;

@Schema({ 
  timestamps: true,
  collection: 'solution_seo_guidelines'
})
export class Guideline {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const GuidelineSchema = SchemaFactory.createForClass(Guideline);

// Ensure proper schema configuration
GuidelineSchema.set('timestamps', true);
GuidelineSchema.set('collection', 'solution_seo_guidelines');

// Create indexes for frequently queried fields
GuidelineSchema.index({ name: 1 });
GuidelineSchema.index({ createdAt: -1 });