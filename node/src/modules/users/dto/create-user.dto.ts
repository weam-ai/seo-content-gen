import { EnumGender } from '@shared/types/roles.t';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  firstname: string;

  @IsNotEmpty()
  lastname: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsNumberString()
  phone: string;

  @IsNumberString()
  @IsOptional()
  phonenumber: string;

  @IsNotEmpty()
  password: string;

  @IsEnum(EnumGender)
  @IsOptional()
  gender: EnumGender;

  @IsDateString()
  @IsOptional()
  dob: Date;

  @IsDateString()
  @IsOptional()
  date_of_joining: Date;

  @IsUrl()
  @IsOptional()
  google_drive: string;

  @IsUrl()
  @IsOptional()
  calendly_url: string;

  @IsBoolean()
  @IsOptional()
  is_wfh: boolean;

  @IsString()
  @IsOptional()
  email_signature: string;

  @IsBoolean()
  @IsOptional()
  admin: boolean;

  @IsString()
  @IsOptional()
  profile_image: string;

  @IsString()
  @IsOptional()
  country: string;

  @IsString()
  @IsOptional()
  state: string;

  @IsString()
  @IsOptional()
  city: string;

  @IsString()
  @IsOptional()
  timezone: string;
}
