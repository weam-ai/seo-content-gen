import { Test, TestingModule } from '@nestjs/testing';
import { ArticleDocumentsService } from './article-documents.service';

describe('ArticleDocumentsService', () => {
  let service: ArticleDocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArticleDocumentsService],
    }).compile();

    service = module.get<ArticleDocumentsService>(ArticleDocumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
