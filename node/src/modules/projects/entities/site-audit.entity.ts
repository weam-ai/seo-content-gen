import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseEntity } from '@shared/entities/basic.entity';
import { Project } from './projects.entity';

export enum SiteAuditStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Schema({ 
  collection: 'solution_seo_site_audit',
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    currentTime: () => new Date()
  }
})
export class SiteAudit extends BaseEntity {
  @Prop({ required: true, maxlength: 500 })
  url: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Object })
  audit_report: Record<string, any>;

  @Prop({
    type: String,
    enum: Object.values(SiteAuditStatus),
    default: SiteAuditStatus.PENDING,
  })
  status: SiteAuditStatus;

  @Prop({ type: String })
  current_step: string;

  @Prop({ type: [String], default: [] })
  progress_steps: string[];

  @Prop({ type: String })
  error_message: string;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  project: Types.ObjectId;
}

export const SiteAuditSchema = SchemaFactory.createForClass(SiteAudit);
export type SiteAuditDocument = SiteAudit & Document;
