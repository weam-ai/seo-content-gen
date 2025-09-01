import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '@modules/users/entities/user.entity';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization token is required');
    }

    try {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Verify JWT token and extract user info
      const payload = this.jwtService.verify(token);
      
      // Extract user information from JWT payload
      const userId = payload.sub || payload.userId;
      if (!userId) {
        throw new UnauthorizedException('Invalid token: user ID not found');
      }

      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      request.user = {
        _id: user._id,
        name: user.email.split('@')[0],
        email: user.email,
        firstname: user.email.split('@')[0],
        lastname: 'User'
      };
      
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
