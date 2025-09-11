import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseEntity } from '@shared/entities/basic.entity';

@Schema({ 
  collection: 'solution_seo_document_updates',
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    currentTime: () => new Date()
  }
})
export class DocumentUpdates extends BaseEntity {
  @Prop({ type: Types.ObjectId, ref: 'Article', required: true })
  article: Types.ObjectId;

  @Prop({ type: Buffer, required: true })
  snapshot_data: Buffer;

  @Prop({ type: String, default: 'default' })
  session_id: string;
}

export const DocumentUpdatesSchema = SchemaFactory.createForClass(DocumentUpdates);
