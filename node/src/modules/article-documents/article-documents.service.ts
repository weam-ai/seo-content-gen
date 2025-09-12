import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentUpdates } from './entities/document-update.entity';
import { Model } from 'mongoose';
import {
  ArticleDocumentRestoreContent,
  ArticleDocumentUpdateContent,
} from './dto/article-document.dto';
import { ARTICLES_STRING } from '@/shared/utils/string.utils';
// import { User } from '../users/entities/user.entity';
import { Article } from '../article/entities/article.entity';
// import { TimeTrackingService } from '../time-tracking/time-tracking.service';

// Minimal User interface for type safety
interface User {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
}
import { toObjectId, getUserId } from '@shared/types/populated-entities';

@Injectable()
export class ArticleDocumentsService {
  constructor(
    @InjectModel(DocumentUpdates.name)
    private readonly documentUpdatesModel: Model<DocumentUpdates>,
    @InjectModel(Article.name)
    private readonly articleModel: Model<Article>,
    // private readonly timeTrackingService: TimeTrackingService,
  ) {}



  async getDocument(articleId: string) {
    const query: any = { article: toObjectId(articleId) };

    let document = await this.documentUpdatesModel
      .findOne(query)
      .select('snapshot_data created_at updated_at')
      .sort({ created_at: -1 })
      .lean();

    if (!document) {
      // Check if article exists
      const article = await this.articleModel.findById(articleId).lean();
      if (!article) {
        throw new NotFoundException(
          ARTICLES_STRING.ERRORS.ARTICLE_NOT_FOUND,
        );
      }

      // Create initial empty document
      const emptyBlocks = JSON.stringify([{
        id: 'initial',
        type: 'paragraph',
        content: [{ type: 'text', text: '' }]
      }]);

      const initialDocument = await this.documentUpdatesModel.create({
         article: toObjectId(articleId),
         snapshot_data: Buffer.from(emptyBlocks),
         session_id: 'initial',
 
         // updated_by: toObjectId(article.user || '000000000000000000000000'), // Removed user requirement
       });

      document = {
        snapshot_data: initialDocument.snapshot_data,

        created_at: (initialDocument as any).createdAt,
        updated_at: (initialDocument as any).updatedAt,
      } as any;
    }

    // Convert Buffer to string for proper JSON serialization
    if (document && document.snapshot_data && Buffer.isBuffer(document.snapshot_data)) {
      (document as any).snapshot_data = document.snapshot_data.toString();
    }

    return document;
  }

  /***
    @description Update or create a single document for the article
    This ensures only one document entry per article instead of creating multiple versions
   */
  async updateDocument(
    articleId: string,
    data: ArticleDocumentUpdateContent,
  ) {
    let snapshot_data = data.snapshot;
    if (typeof snapshot_data === 'string') {
      try {
        snapshot_data = Buffer.from(snapshot_data);
      } catch {
        throw new BadRequestException(
          ARTICLES_STRING.ERRORS.ARTICLE_DOCUMENT_INVALID_SNAPSHOT,
        );
      }
    }

    // Check if the existing document contains the same snapshot data
    const existingDocument = await this.documentUpdatesModel.findOne({
      article: toObjectId(articleId)
    });

    // If there is an existing document and its snapshot_data matches the new snapshot_data, don't update
    if (existingDocument && existingDocument.snapshot_data && Buffer.isBuffer(snapshot_data)) {
      if (existingDocument.snapshot_data.compare(snapshot_data) === 0) {
        // Return the existing document to indicate no changes were made
        return existingDocument;
      }
    }

    // Update or create a single document for this article
    const result = await this.documentUpdatesModel.findOneAndUpdate(
      { article: toObjectId(articleId) },
      {
        snapshot_data: snapshot_data,
        session_id: data.session_id || 'default',
        updated_at: new Date(),
      },
      {
        new: true,
        upsert: true, // Create if doesn't exist
        setDefaultsOnInsert: true,
      }
    );

    // Update the article's updated_at timestamp
    await this.articleModel.updateOne(
      { _id: toObjectId(articleId) },
      { updated_at: new Date() },
    );

    return result;
  }


}
