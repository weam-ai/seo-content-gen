import {
  Controller,
  Post,
  Body,
  Res,
  Param,
  Patch,
  Get,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import {
  successPaginationResponseWithData,
  successResponse,
  successResponseWithData,
} from '@shared/utils/reponses.utils';
import { USERS_STRING } from '@shared/utils/string.utils';
import { FileInterceptor } from '@nestjs/platform-express';
import { instanceToPlain } from 'class-transformer';
import { S3Service } from '@shared/services/s3.service';
import { getUserId } from '@shared/types/populated-entities';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly s3Service: S3Service,
  ) {}

  // Removed agency members endpoint - not needed for single-user application

  // Removed staff members endpoint - not needed for single-user application

  // Removed all list endpoints - not needed for single-user application

  // Removed view user by ID endpoint - not needed for single-user application

  // Removed create user endpoint - not needed for single-user application

  @Patch('profile')
  async myProfileUpdate(
    @Req() req: Request,
    @Res() res: Response,
    @Body() UpdateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(getUserId(req.user!), UpdateUserDto);
    return successResponseWithData(
      res,
      USERS_STRING.SUCCESS.USER_UPDATED,
      user,
    );
  }

  // Removed update user by ID endpoint - not needed for single-user application

  // Removed update profile image for other users endpoint - not needed for single-user application

  @Post('self-profile-image')
  @UseInterceptors(FileInterceptor('profile_image'))
  async updateSelfProfileImage(
    @UploadedFile() profile_image: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Generate unique file key and upload to S3
    const fileKey = `profile-images/${getUserId(req.user!)}-${Date.now()}-${profile_image.originalname}`;
    const imageUrl = await this.s3Service.uploadFile(fileKey, profile_image.buffer);
    await this.usersService.updateProfileImage(getUserId(req.user!), imageUrl);
    return successResponse(res, USERS_STRING.SUCCESS.USER_UPDATED);
  }

  // Removed bulk user assignment endpoint - not needed for single-user application
}
