import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseEntity } from '@shared/entities/basic.entity';

export type MeetingNoteDocument = MeetingNote & Document;

@Schema({ 
  timestamps: true,
  collection: 'meeting_notes'
})
export class MeetingNote extends BaseEntity {
  @Prop({ required: true, maxlength: 500 })
  agenda: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Date, required: true })
  meeting_date: Date;

  // Removed agency field - single user application

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  project?: Types.ObjectId;
}

export const MeetingNoteSchema = SchemaFactory.createForClass(MeetingNote);

// Create indexes for frequently queried fields
MeetingNoteSchema.index({ user: 1, meeting_date: -1 });
MeetingNoteSchema.index({ project: 1 });
MeetingNoteSchema.index({ deleted_at: 1 });
