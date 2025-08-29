import { Test, TestingModule } from '@nestjs/testing';
import { MeetingNotesService } from './meeting-note.service';

describe('MeetingNotesService', () => {
  let service: MeetingNotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MeetingNotesService],
    }).compile();

    service = module.get<MeetingNotesService>(MeetingNotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
