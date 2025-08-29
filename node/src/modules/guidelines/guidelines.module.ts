import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { GuidelinesService } from './guidelines.service';
import { GuidelinesController } from './guidelines.controller';
import { Guideline, GuidelineSchema } from './entities/guideline.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Guideline.name, schema: GuidelineSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [GuidelinesController],
  providers: [GuidelinesService],
  exports: [GuidelinesService],
})
export class GuidelinesModule {}