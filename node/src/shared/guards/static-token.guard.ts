import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AUTH_STRING } from '../utils/string.utils';
import { logger } from '../utils/logger.utils';

@Injectable()
export class StaticTokenGuard implements CanActivate {
  private readonly STATIC_TOKEN: string;

  constructor(private readonly configService: ConfigService) {
    this.STATIC_TOKEN = this.configService.get<string>('STATIC_AUTH_TOKEN', '');
  }

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const token = request.headers['authorization']; // Expecting `Authorization: Bearer <token>`
    logger.log('info', `STATIC_TOKEN : ${this.STATIC_TOKEN}`);

    if (!token || token !== `Bearer ${this.STATIC_TOKEN}`) {
      throw new UnauthorizedException(AUTH_STRING.ERROR.UNAUTHORIZED);
    }

    return true;
  }
}
