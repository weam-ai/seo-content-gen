// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { User } from '@modules/users/entities/user.entity';

declare module 'express' {
  interface Request {
    refresh_id: string;
    user?: User;
  }
}
