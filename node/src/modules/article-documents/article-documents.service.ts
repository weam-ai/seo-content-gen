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

  async getDocumentVersions(articleId: string) {
    const versions = await this.documentUpdatesModel
      .find({ article: toObjectId(articleId) })
      .select('version created_at updated_at updated_by')
      .populate({
        path: 'updated_by',
        select: 'firstname lastname profile_image'
      })
      .sort({ version: -1 })
      .lean();
    return versions;
  }

  async getDocument(articleId: string, version?: number) {
    const query: any = { article: toObjectId(articleId) };
    
    if (version !== undefined) {
      query.version = version;
    }

    let document = await this.documentUpdatesModel
      .findOne(query)
      .select('snapshot_data version created_at updated_at')
      .sort({ version: -1 })
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
         version: 1,
         updated_by: toObjectId(article.user || '000000000000000000000000'),
       });

      document = {
        snapshot_data: initialDocument.snapshot_data,
        version: initialDocument.version,
        created_at: (initialDocument as any).createdAt,
        updated_at: (initialDocument as any).updatedAt,
      } as any;
    }

    return document;
  }

  /***
    @description If article document exists, check if the session_id is the same as the one in the request
      If it is, update the document
      If it is not, create a new document
   */
  async updateDocument(
    articleId: string,
    data: ArticleDocumentUpdateContent,
    user: User,
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

    // Check if the last version contains the same snapshot data
    const lastVersion = await this.documentUpdatesModel
      .findOne({ article: toObjectId(articleId) })
      .sort({ version: -1 })
      .lean();

    // If there is a last version and its snapshot_data matches the new snapshot_data, don't create a new version
    if (lastVersion && Buffer.compare(lastVersion.snapshot_data as unknown as Buffer, snapshot_data as Buffer) === 0) {
      // Return an empty result to indicate no changes were made
      return {
        raw: [],
        affected: 0,
        generatedMaps: [],
        identifiers: [],
      };
    }

    // Update timer activity if user is currently tracking time on this article
    // await this.timeTrackingService.updateTimerActivity(user.id, articleId);

    // version handling is done automatically by the database triggers {{check_document_version_insert}}
    const result = await this.documentUpdatesModel.create({
      article: toObjectId(articleId),
      snapshot_data: snapshot_data,
      session_id: data.session_id,
      updated_by: toObjectId(user._id || user.id || ''),
    });

    // Update the article's updated_at timestamp
    await this.articleModel.updateOne(
      { _id: toObjectId(articleId) },
      { updated_at: new Date() },
    );

    return result;
  }

  async restoreToVersion(
    articleId: string,
    version: number,
    data: ArticleDocumentRestoreContent,
    user: User,
  ) {
    const document = await this.documentUpdatesModel
      .findOne({ article: toObjectId(articleId), version })
      .lean();

    if (!document) {
      throw new NotFoundException(
        ARTICLES_STRING.ERRORS.ARTICLE_DOCUMENT_NOT_FOUND,
      );
    }

    // Update timer activity if user is currently tracking time on this article
    // await this.timeTrackingService.updateTimerActivity(user.id, articleId);

    const result = await this.documentUpdatesModel.create({
      article: toObjectId(articleId),
      snapshot_data: document.snapshot_data,
      session_id: data.session_id,
      updated_by: toObjectId(user._id || user.id || ''),
    });

    // Update the article's updated_at timestamp
    await this.articleModel.updateOne(
      { _id: toObjectId(articleId) },
      { updated_at: new Date() },
    );

    return result;
  }
}
