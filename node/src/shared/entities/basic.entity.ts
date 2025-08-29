import { Prop, Schema } from '@nestjs/mongoose';
import { Exclude } from 'class-transformer';

@Schema({ timestamps: true })
export class BaseEntity {
  @Prop({ type: Date, default: Date.now })
  created_at: Date;

  @Exclude()
  @Prop({ type: Date, default: Date.now })
  updated_at: Date;

  @Exclude()
  @Prop({ type: Date, default: Date.now })
  deleted_at?: Date;
}
