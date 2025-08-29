import { Test, TestingModule } from '@nestjs/testing';
import { SystemPromptsController } from './system-prompts.controller';
import { SystemPromptsService } from './system-prompts.service';

describe('SystemPromptsController', () => {
  let controller: SystemPromptsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemPromptsController],
      providers: [SystemPromptsService],
    }).compile();

    controller = module.get<SystemPromptsController>(SystemPromptsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
