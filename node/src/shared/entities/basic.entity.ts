import { Prop, Schema } from '@nestjs/mongoose';
import { Exclude } from 'class-transformer';

@Schema({ 
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    currentTime: () => new Date()
  }
})
export class BaseEntity {
  @Exclude()
  @Prop({ type: Date, default: null })
  deleted_at?: Date;

  @Prop({ type: Date })
  created_at: Date;

  @Prop({ type: Date })
  updated_at: Date;
}
