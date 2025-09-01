import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseEntity } from '@shared/entities/basic.entity';
import {
  ArticleSettings,
  ArticleStatus,
  KeywordDifficulty,
} from '@shared/types/articles.t';
import { Exclude } from 'class-transformer';

@Schema({ 
  collection: 'solution_seo_articles',
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    currentTime: () => new Date()
  }
})
export class Article extends BaseEntity {
  @Prop({ maxlength: 191 })
  name?: string;

  @Prop({ type: String, enum: ArticleStatus, default: ArticleStatus.PENDING })
  status: ArticleStatus;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  project: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  user?: Types.ObjectId;

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

  @Prop({ type: Date })
  start_date: Date;

  @Prop({ type: Date })
  end_date: Date;

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

// Ensure proper JSON serialization without _id to id transformation
ArticleSchema.set('toJSON', {
  transform: function(doc: any, ret: any) {
    delete ret.__v;
    return ret;
  }
});
