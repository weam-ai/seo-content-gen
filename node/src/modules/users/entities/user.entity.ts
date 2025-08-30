import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { EnumGender } from '@shared/types/roles.t';

export type UserDocument = User & Document;

@Schema({ 
  timestamps: true,
  collection: 'users'
})
export class User {
  @Prop({ required: true, unique: true, maxlength: 100 })
  email: string;

  @Prop({ required: true, maxlength: 50 })
  firstname: string;

  @Prop({ required: true, maxlength: 50 })
  lastname: string;

  @Prop({ maxlength: 30 })
  phonenumber?: string;

  @Exclude()
  @Prop({ maxlength: 250 })
  password?: string;

  @Prop()
  profile_image?: string;

  @Prop({ type: Date })
  dob?: Date;

  @Prop({ enum: EnumGender })
  gender?: EnumGender;

  @Exclude()
  @Prop({ maxlength: 40 })
  last_ip?: string;

  @Exclude()
  @Prop({ type: Date })
  last_login?: Date;

  @Exclude()
  @Prop({ type: Date })
  last_activity?: Date;

  @Exclude()
  @Prop({ type: Date })
  last_password_change?: Date;

  @Exclude()
  @Prop({ maxlength: 32 })
  new_pass_key?: string;

  @Exclude()
  @Prop({ type: Date })
  new_pass_key_requested?: Date;

  @Exclude()
  @Prop({ default: false })
  admin: boolean;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: false })
  two_factor_auth_enabled?: boolean;

  @Exclude()
  @Prop({ maxlength: 100 })
  two_factor_auth_code?: string;

  @Exclude()
  @Prop({ type: Date })
  two_factor_auth_code_requested?: Date;

  @Prop()
  email_signature?: string;

  @Exclude()
  @Prop({ type: Date })
  email_verified_at?: Date;

  @Exclude()
  @Prop({ maxlength: 100 })
  email_verification_key?: string;

  @Exclude()
  @Prop({ type: Date })
  email_verification_sent_at?: Date;

  @Exclude()
  @Prop({ maxlength: 250 })
  device_fcm_token?: string;

  @Prop({ default: false })
  is_wfh: boolean;

  @Exclude()
  @Prop({ default: true })
  is_notification_send: boolean;

  @Exclude()
  @Prop({ default: true })
  is_email_send: boolean;

  @Prop({ type: Date })
  date_of_joining?: Date;



  @Prop()
  calendly_url?: string;

  @Prop()
  google_drive?: string;

  @Prop({ maxlength: 100 })
  timezone?: string;

  @Prop({ maxlength: 50 })
  country?: string;

  @Prop({ maxlength: 50 })
  state?: string;

  @Prop({ maxlength: 50 })
  city?: string;

  // Simplified for single-user application - removed all collaboration relationships
  // Projects, articles, and other relationships will be handled through references
}

export const UserSchema = SchemaFactory.createForClass(User);

// Ensure proper JSON serialization without _id to id transformation
UserSchema.set('toJSON', {
  transform: function(doc: any, ret: any) {
    delete ret.__v;
    return ret;
  }
});

// Add indexes for frequently queried fields
UserSchema.index({ email: 1 });
UserSchema.index({ active: 1 });
UserSchema.index({ createdAt: -1 });
