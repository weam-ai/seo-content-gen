import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { GeminiService } from './gemini.service';
import { GeminiController } from './gemini.controller';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [GeminiService],
  controllers: [GeminiController],
  exports: [GeminiService],
})
export class GeminiModule {}