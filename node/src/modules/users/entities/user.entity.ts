import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ 
  timestamps: true,
  collection: 'users'
})
export class User {
  @Prop({ required: true, unique: true, maxlength: 100 })
  email: string;

  // Simplified for single-user application - only _id and email needed
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
