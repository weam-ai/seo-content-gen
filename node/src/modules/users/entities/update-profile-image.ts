import { IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateProfileImageDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
