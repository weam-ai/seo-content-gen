import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHmac, timingSafeEqual } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '@modules/users/entities/user.entity';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  private base64UrlToBuffer(input: string): Buffer {
    const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    const padded = pad ? b64 + '='.repeat(4 - pad) : b64;
    return Buffer.from(padded, 'base64');
  }

  private signHs256(base: string, secret: string): string {
    const sig = createHmac('sha256', secret).update(base).digest('base64');
    return sig.replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  private verifyAndDecode(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Malformed JWT');
    }
    const [headerB64, payloadB64, signatureB64] = parts;

    const headerJson = this.base64UrlToBuffer(headerB64).toString('utf8');
    let header: any;
    try { header = JSON.parse(headerJson); } catch {
      throw new UnauthorizedException('Invalid JWT header');
    }
    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
      throw new UnauthorizedException('Unsupported JWT header');
    }

    const payloadJson = this.base64UrlToBuffer(payloadB64).toString('utf8');
    let payload: any;
    try { payload = JSON.parse(payloadJson); } catch {
      throw new UnauthorizedException('Invalid JWT payload');
    }

    const secret = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException('JWT secret not configured');
    }
    const base = `${headerB64}.${payloadB64}`;
    const expectedSig = this.signHs256(base, secret);

    // Compare raw bytes of base64url-decoded signatures
    const a = this.base64UrlToBuffer(signatureB64);
    const b = this.base64UrlToBuffer(expectedSig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid JWT signature');
    }

    return payload;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization token is required');
    }

    try {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify JWT token and extract user info using custom HS256 verification
      const payload = this.verifyAndDecode(token);

      // Extract user information from JWT payload
      const userId = payload?.id || payload?.sub || payload?.userId;
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
