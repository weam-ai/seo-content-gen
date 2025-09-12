import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { GuidelinesService } from './guidelines.service';
import { GuidelinesController } from './guidelines.controller';
import { Guideline, GuidelineSchema } from './entities/guideline.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Project, ProjectSchema } from '../projects/entities/projects.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Guideline.name, schema: GuidelineSchema },
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'razorcopy',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [GuidelinesController],
  providers: [GuidelinesService],
  exports: [GuidelinesService],
})
export class GuidelinesModule {}