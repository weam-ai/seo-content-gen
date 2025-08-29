import { Test, TestingModule } from '@nestjs/testing';
import { PromptTypesService } from './prompt-types.service';

describe('PromptTypesService', () => {
  let service: PromptTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptTypesService],
    }).compile();

    service = module.get<PromptTypesService>(PromptTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
