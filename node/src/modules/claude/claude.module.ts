import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ClaudeService } from './claude.service';
import { ClaudeController } from './claude.controller';
import { User, UserSchema } from '../users/entities/user.entity';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'razorcopy',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [ClaudeController],
  providers: [ClaudeService],
  exports: [ClaudeService],
})
export class ClaudeModule {}