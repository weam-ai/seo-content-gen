import { Test, TestingModule } from '@nestjs/testing';
import { MeetingNotesController } from './meeting-note.controller';
import { MeetingNotesService } from './meeting-note.service';

describe('MeetingNotesController', () => {
  let controller: MeetingNotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeetingNotesController],
      providers: [MeetingNotesService],
    }).compile();

    controller = module.get<MeetingNotesController>(MeetingNotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
