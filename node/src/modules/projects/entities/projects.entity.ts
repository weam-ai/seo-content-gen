import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseEntity } from '@shared/entities/basic.entity';
import { Exclude, Transform } from 'class-transformer';
import { KeywordMetric } from '@shared/types/dataForSeo.t';

@Schema({ collection: 'projects', toJSON: { virtuals: true } })
export class Project extends BaseEntity {
  @Prop({ required: true, maxlength: 191 })
  name: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: [String] })
  competitors_websites: string[];

  @Prop({ type: [String] })
  targeted_keywords: string[];

  @Prop({ type: [String] })
  recommended_keywords: string[];

  @Prop({ type: String, maxlength: 255 })
  website_url: string;

  @Prop({ type: String })
  topic_titles: string;

  @Prop({ required: true, maxlength: 100 })
  language: string;

  @Prop({ type: [String] })
  location: string[];

  @Prop({ required: true, maxlength: 255 })
  targeted_audience: string;

  @Prop({ type: String })
  sitemapdata: string;

  @Prop({ type: String })
  detailedsitemap: string;

  @Prop({ type: [Object], default: [] })
  keywords: KeywordMetric[];

  @Prop({ type: String })
  organization_archetype: string;

  @Prop({ type: String })
  brand_spokesperson: string;

  @Prop({ type: String })
  most_important_thing: string;

  @Prop({ type: String })
  unique_differentiator: string;

  // @Prop({ type: String })
  // author_bio: string; // Author bio functionality removed

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user?: Types.ObjectId;

  // Removed assign_to field

  //article
  @Exclude()
  articles?: Types.ObjectId[];

  @Exclude()
  recommendedKeywords?: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Guideline' })
  guideline?: Types.ObjectId;

  @Prop({ type: String })
  guideline_description: string;

  sitemaps?: Types.ObjectId[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Add virtual id field that transforms _id to string
ProjectSchema.virtual('id').get(function() {
  return this._id?.toString();
});

// Ensure virtual fields are serialized
ProjectSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc: any, ret: any) {
    ret.id = ret._id?.toString();
    return ret;
  }
});

export type ProjectDocument = Project & Document;
