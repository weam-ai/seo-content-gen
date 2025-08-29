import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For single-user mode, set default user if no token provided
      request.user = {
        _id: '68ac079f7abf7963615fcec7',
        id: '68ac079f7abf7963615fcec7',
        name: 'SEO Content Generator User',
        email: 'user@seo-content-gen.local',
        firstname: 'SEO',
        lastname: 'User'
      };
      return true;
    }

    try {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // For static token in development, just decode without verification
      if (token === 'static-jwt-token-for-local-testing') {
        request.user = {
          _id: '68ac079f7abf7963615fcec7',
          id: '68ac079f7abf7963615fcec7',
          name: 'SEO Content Generator User',
          email: 'user@seo-content-gen.local',
          firstname: 'SEO',
          lastname: 'User'
        };
        return true;
      }
      
      // For production JWT tokens, verify and extract user info
      const payload = this.jwtService.verify(token);
      
      // Extract user information from JWT payload
      request.user = {
        _id: payload.sub || payload.userId || '68ac079f7abf7963615fcec7',
        id: payload.sub || payload.userId || '68ac079f7abf7963615fcec7',
        name: payload.name || 'User',
        email: payload.email || 'user@example.com',
        firstname: payload.firstname || 'User',
        lastname: payload.lastname || ''
      };
      
      return true;
    } catch (error) {
      // If JWT verification fails, fall back to default user for single-user mode
      request.user = {
        _id: '68ac079f7abf7963615fcec7',
        id: '68ac079f7abf7963615fcec7',
        name: 'SEO Content Generator User',
        email: 'user@seo-content-gen.local',
        firstname: 'SEO',
        lastname: 'User'
      };
      return true;
    }
  }
}
