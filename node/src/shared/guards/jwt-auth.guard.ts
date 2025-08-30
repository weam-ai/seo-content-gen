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
      // For single-user mode, get the actual user from database
       const user = await this.userModel.findOne().exec();
       if (user) {
         request.user = {
           _id: (user._id as any).toString(),
           name: user.email.split('@')[0],
           email: user.email,
           firstname: user.email.split('@')[0],
           lastname: 'User'
         };
       }
      return true;
    }

    try {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // For static token in development, get actual user from database
      if (token === 'static-jwt-token-for-local-testing') {
        const user = await this.userModel.findOne().exec();
         if (user) {
           request.user = {
             _id: (user._id as any).toString(),
             name: user.email.split('@')[0],
             email: user.email,
             firstname: user.email.split('@')[0],
             lastname: 'User'
           };
         }
        return true;
      }
      
      // For production JWT tokens, verify and extract user info
      const payload = this.jwtService.verify(token);
      
      // Extract user information from JWT payload or get from database
      let userId = payload.sub || payload.userId;
      if (userId) {
        const user = await this.userModel.findById(userId).exec();
         if (user) {
           request.user = {
             _id: (user._id as any).toString(),
             name: user.email.split('@')[0],
             email: user.email,
             firstname: user.email.split('@')[0],
             lastname: 'User'
           };
         }
      } else {
        // Fallback to first user in database
         const user = await this.userModel.findOne().exec();
         if (user) {
           request.user = {
           _id: (user._id as any).toString(),
           name: user.email.split('@')[0],
           email: user.email,
           firstname: user.email.split('@')[0],
           lastname: 'User'
         };
         }
      }
      
      return true;
    } catch (error) {
      // If JWT verification fails, fall back to actual user from database
       const user = await this.userModel.findOne().exec();
       if (user) {
         request.user = {
           _id: (user._id as any).toString(),
           name: user.email.split('@')[0],
           email: user.email,
           firstname: user.email.split('@')[0],
           lastname: 'User'
         };
       }
      return true;
    }
  }
}
