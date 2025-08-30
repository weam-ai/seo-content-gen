import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseEntity } from '@shared/entities/basic.entity';
import { DataForSeoKeyRecommendationResult } from '@shared/types/dataForSeo.t';

@Schema({ collection: 'solution_seo_recommended_keywords' })
export class RecommendedKeyword extends BaseEntity {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  project: Types.ObjectId;

  @Prop({ type: [Object] })
  keywords: DataForSeoKeyRecommendationResult[];
}

export const RecommendedKeywordSchema = SchemaFactory.createForClass(RecommendedKeyword);
