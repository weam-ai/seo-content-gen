import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseEntity } from '@shared/entities/basic.entity';
import { ArticleFrom } from '@shared/types/articles.t';
import { Exclude } from 'class-transformer';

@Schema({ collection: 'solution_seo_articles_content' })
export class ArticleContent extends BaseEntity {
  @Exclude()
  // Virtual reference - articles will be populated via virtual
  articles?: Types.ObjectId[];

  @Prop({ type: String })
  open_ai_content: string | null;

  @Prop({ type: String })
  gemini_content: string | null;

  @Prop({ type: String })
  claude_content: string | null;

  @Prop({ type: String, enum: ArticleFrom, default: null })
  selected_content: ArticleFrom | null;

  @Prop({ type: Number })
  avg_word_count: number | null;
}

export const ArticleContentSchema = SchemaFactory.createForClass(ArticleContent);

// Ensure proper JSON serialization without _id to id transformation
ArticleContentSchema.set('toJSON', {
  transform: function(doc: any, ret: any) {
    delete ret.__v;
    return ret;
  }
});
