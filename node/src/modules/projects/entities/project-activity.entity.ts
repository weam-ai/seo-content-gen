import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseEntity } from '@shared/entities/basic.entity';

@Schema({ collection: 'solution_seo_project_activity' })
export class ProjectActivity extends BaseEntity {
  @Prop({ type: Types.ObjectId, ref: 'Project' })
  project?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  staff?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user_id?: Types.ObjectId;

  @Prop({ type: String })
  description_key: string;

  @Prop({ type: String })
  additional_data: string;
}

export const ProjectActivitySchema = SchemaFactory.createForClass(ProjectActivity);
