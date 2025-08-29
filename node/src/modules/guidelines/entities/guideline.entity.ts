import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GuidelineDocument = Guideline & Document;

@Schema({ 
  timestamps: true,
  collection: 'guidelines'
})
export class Guideline {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Date, default: null })
  deleted_at?: Date;
}

export const GuidelineSchema = SchemaFactory.createForClass(Guideline);

// Ensure proper schema configuration
GuidelineSchema.set('timestamps', true);
GuidelineSchema.set('collection', 'guidelines');

// Create indexes for frequently queried fields
GuidelineSchema.index({ name: 1 });
GuidelineSchema.index({ created_at: -1 });