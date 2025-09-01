import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseEntity } from '@shared/entities/basic.entity';

export type DocChange = { added: number; removed: number; netChange: number };

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

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Number, default: 1 })
  version: number;

  @Prop({ type: Buffer })
  snapshot_data: Buffer;

  @Prop({ type: String, default: null })
  session_id: string;

  @Prop({ type: Object, default: null })
  changes: DocChange;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updated_by: Types.ObjectId;
}

export const DocumentUpdatesSchema = SchemaFactory.createForClass(DocumentUpdates);
