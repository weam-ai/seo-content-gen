import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClaudeService } from './claude.service';
import { ClaudeController } from './claude.controller';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [ClaudeController],
  providers: [ClaudeService],
  exports: [ClaudeService],
})
export class ClaudeModule {}