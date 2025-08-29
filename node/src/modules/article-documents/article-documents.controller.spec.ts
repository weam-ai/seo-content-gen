import { Test, TestingModule } from '@nestjs/testing';
import { ArticleDocumentsController } from './article-documents.controller';

describe('ArticleDocumentsController', () => {
  let controller: ArticleDocumentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticleDocumentsController],
    }).compile();

    controller = module.get<ArticleDocumentsController>(
      ArticleDocumentsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
