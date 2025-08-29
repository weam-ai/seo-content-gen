import { Module } from '@nestjs/common';
import { MeetingNotesService } from './meeting-note.service';
import { MeetingNotesController } from './meeting-note.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MeetingNote, MeetingNoteSchema } from './entities/meeting-note.entity';
import { User, UserSchema } from '../users/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MeetingNote.name, schema: MeetingNoteSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  controllers: [MeetingNotesController],
  providers: [MeetingNotesService],
  exports: [MeetingNotesService],
})
export class MeetingNotesModule {}
