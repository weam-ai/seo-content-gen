import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseEntity } from '@shared/entities/basic.entity';

export type AgencyDetailsDocument = AgencyDetails & Document;

@Schema({ 
  timestamps: true,
  collection: 'agency_details'
})
export class AgencyDetails extends BaseEntity {
  @Prop({ maxlength: 255 })
  agency_name?: string;

  // Removed primary_manager field - single user application

  @Prop({ maxlength: 50 })
  country?: string;

  @Prop({ maxlength: 50 })
  state?: string;

  @Prop({ maxlength: 50 })
  city?: string;

  @Prop({ maxlength: 10 })
  zipcode?: string;
}

export const AgencyDetailsSchema = SchemaFactory.createForClass(AgencyDetails);

// Create indexes for frequently queried fields
AgencyDetailsSchema.index({ agency_name: 1 });
AgencyDetailsSchema.index({ country: 1, state: 1, city: 1 });
