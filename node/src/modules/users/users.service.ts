import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { USERS_STRING } from '@shared/utils/string.utils';
import { S3Service } from '@shared/services/s3.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly eventEmitter: EventEmitter2,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Create a new user (simplified for single-user app)
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new ConflictException(USERS_STRING.ERROR.USER_EXIST);
    }

    // Create user payload - simplified for single-user application
    const userPayload = {
      email: createUserDto.email,
      email_verified_at: new Date(),
    };

    const createdUser = new this.userModel(userPayload);
    return createdUser.save();
  }

  /**
   * Find all users with pagination
   */
  async findAll(filters: {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
    sort?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    if (filters.is_active !== undefined) {
      query.active = filters.is_active;
    }

    if (filters.search) {
      query.$or = [
        { firstname: { $regex: filters.search, $options: 'i' } },
        { lastname: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Build sort
    let sort: any = { createdAt: -1 };
    if (filters.sort) {
      const [field, order] = filters.sort.split(':');
      sort = { [field]: order === 'desc' ? -1 : 1 };
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-password -email_verification_key -two_factor_auth_code')
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    return {
      users,
      pagination: {
        total_records: total,
        current_page: page,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find user by ID
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userModel
      .findById(id)
      .select('-password -email_verification_key -two_factor_auth_code')
      .exec();
    
    if (!user) {
      throw new NotFoundException(USERS_STRING.ERROR.USER_NOT_FOUND);
    }
    
    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * Update user
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(USERS_STRING.ERROR.USER_NOT_FOUND);
    }

    const updateData: any = { ...updateUserDto };

    // If password is being updated, hash it
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password -email_verification_key -two_factor_auth_code')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(USERS_STRING.ERROR.USER_NOT_FOUND);
    }

    return updatedUser;
  }

  /**
   * Delete user (soft delete by setting active to false)
   */
  async remove(id: string): Promise<void> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(USERS_STRING.ERROR.USER_NOT_FOUND);
    }

    await this.userModel.findByIdAndUpdate(id, { active: false });
  }

  /**
   * Verify user password (disabled for single-user app)
   */
  async verifyPassword(user: User, password: string): Promise<boolean> {
    // Always return true for single-user application
    return true;
  }

  /**
   * Update user's last login
   */
  async updateLastLogin(userId: string, ip?: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      last_login: new Date(),
      last_activity: new Date(),
      ...(ip && { last_ip: ip }),
    });
  }

  /**
   * Update user's profile image
   */
  async updateProfileImage(userId: string, imageUrl: string): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { profile_image: imageUrl },
        { new: true }
      )
      .select('-password -email_verification_key -two_factor_auth_code')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(USERS_STRING.ERROR.USER_NOT_FOUND);
    }

    return updatedUser;
  }

  /**
   * Verify user email
   */
  async verifyEmail(email: string, key: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email, email_verification_key: key });
    if (!user) {
      return false;
    }

    const result = await this.userModel.updateOne(
      { _id: user._id },
      { 
        email_verified: true, 
        email_verification_key: null,
        email_verified_at: new Date()
      }
    );
    
    return result.modifiedCount > 0;
  }

  /**
   * Generate password reset key
   */
  async generatePasswordResetKey(email: string): Promise<string> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException(USERS_STRING.ERROR.USER_NOT_FOUND);
    }

    const salt = await bcrypt.genSalt(10);
    const resetKey = await bcrypt.hash(
      email + Date.now() + Math.random().toString(),
      salt,
    );

    await this.userModel.findByIdAndUpdate(user._id, {
      new_pass_key: resetKey.replace(/\//g, ''),
      new_pass_key_requested: new Date(),
    });

    return resetKey.replace(/\//g, '');
  }

  /**
   * Reset password (disabled for single-user app)
   */
  async resetPassword(resetKey: string, newPassword: string): Promise<User> {
    throw new BadRequestException('Password reset not supported in single-user application');
  }
}
