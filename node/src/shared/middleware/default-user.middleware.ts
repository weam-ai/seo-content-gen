import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// Removed UsersService import - service deleted

@Injectable()
export class DefaultUserMiddleware implements NestMiddleware {
  constructor() {
    // Simplified middleware - users service removed
  }

  async use(req: Request, res: Response, next: NextFunction) {
    // If user is not already set (no JWT auth), set a default user
    if (!(req as any).user) {
      // Set static default user since users service was removed
      // Using same ID as frontend auth store for consistency
      (req as any).user = {
        id: 'static-user-1',
        _id: 'static-user-1',
        name: 'SEO User',
        email: 'user@seo-content-gen.local'
      };
    }
    next();
  }
}