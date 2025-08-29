import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, [] as const),
) {
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsBoolean()
  @IsOptional()
  two_factor_auth_enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  is_notification_send?: boolean;

  @IsBoolean()
  @IsOptional()
  is_email_send?: boolean;

  @IsUUID()
  @IsOptional()
  primary_manager_id?: string;
}
