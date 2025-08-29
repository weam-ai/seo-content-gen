import { Test, TestingModule } from '@nestjs/testing';
import { PromptTypesController } from './prompt-types.controller';
import { PromptTypesService } from './prompt-types.service';

describe('PromptTypesController', () => {
  let controller: PromptTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromptTypesController],
      providers: [PromptTypesService],
    }).compile();

    controller = module.get<PromptTypesController>(PromptTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
