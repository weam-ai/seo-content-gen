import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseEntity } from '@shared/entities/basic.entity';
import { ArticleFrom } from '@shared/types/articles.t';
import { Exclude } from 'class-transformer';

@Schema({ collection: 'articles_content' })
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

// Add virtual field to transform _id to id for frontend compatibility
ArticleContentSchema.virtual('id').get(function(this: any) {
  return this._id ? this._id.toHexString() : undefined;
});

// Ensure virtual fields are serialized
ArticleContentSchema.set('toJSON', {
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
