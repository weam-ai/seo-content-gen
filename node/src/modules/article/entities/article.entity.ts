import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseEntity } from '@shared/entities/basic.entity';
import {
  ArticleSettings,
  ArticleStatus,
  KeywordDifficulty,
} from '@shared/types/articles.t';
import { Exclude } from 'class-transformer';

@Schema({ collection: 'articles' })
export class Article extends BaseEntity {
  @Prop({ maxlength: 191 })
  name?: string;

  @Prop({ type: String, enum: ArticleStatus, default: ArticleStatus.PENDING })
  status: ArticleStatus;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  project: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: String })
  keywords: string;

  @Prop({ type: Number })
  keyword_volume: number;

  @Prop({ type: String, enum: KeywordDifficulty })
  keyword_difficulty: KeywordDifficulty;

  @Prop({ type: String, default: null })
  published_url: string | null;

  @Prop({ type: Boolean, default: false })
  is_content_generated: boolean | null;

  @Prop({ type: Boolean, default: false })
  is_outline_generated: boolean | null;

  @Prop({ type: Date, default: Date.now })
  start_date: Date | null;

  @Prop({ type: Date, default: null })
  end_date: Date | null;

  @Prop({ type: [String], default: [] })
  secondary_keywords: string[];

  // Removed assigned_members and assign_followers fields

  @Prop({ type: String })
  generated_outline: string;

  // @Prop({ type: String })
  // author_bio: string; // Author bio functionality removed

  @Exclude()
  @Prop({ type: Types.ObjectId, ref: 'ArticleContent' })
  article_content: Types.ObjectId;

  @Exclude()
  // Virtual reference - articles_documents will be populated via virtual
  articles_documents?: Types.ObjectId[];



  @Prop({ type: Number })
  priority?: number;

  @Prop({ type: Date })
  approved_at?: Date;

  @Prop({ type: Object })
  audit_report?: { [key: string]: any } | null;

  @Prop({ type: Date })
  audit_report_generated_at?: Date;

  @Prop({ type: Object })
  settings?: ArticleSettings | null;

  @Prop({ type: String, default: null })
  meta_title: string;

  @Prop({ type: String, default: null })
  meta_description: string;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);

// Add virtual field to transform _id to id for frontend compatibility
ArticleSchema.virtual('id').get(function(this: any) {
  return this._id ? this._id.toHexString() : undefined;
});

// Ensure virtual fields are serialized
ArticleSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc: any, ret: any) {
    if (ret._id) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
    delete ret.__v;
    return ret;
  }
});
