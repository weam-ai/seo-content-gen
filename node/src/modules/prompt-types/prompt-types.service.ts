import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreatePromptTypeDto } from './dto/create-prompt-type.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PromptType, PromptTypeDocument } from './entities/prompt-type.entity';
import { Article, ArticleDocument } from '../article/entities/article.entity';
import { SystemPromptsService } from '../system-prompts/system-prompts.service';
import { SYSTEM_PROMPT_TYPES } from '@/shared/types/system-prompt.t';
import { PROMPT_TYPES_STRING } from '@/shared/utils/string.utils';
import {
  ListPromptTypeQuery,
  ListPromptTypeQueryPagination,
} from './dto/list-prompt-types.dto';
import { Pagination } from '@/shared/types/response.t';
import { toObjectId } from '@/shared/types/populated-entities';

@Injectable()
export class PromptTypesService {
  constructor(
    @InjectModel(PromptType.name)
    private readonly promptTypeModel: Model<PromptTypeDocument>,
    @InjectModel(Article.name)
    private readonly articleModel: Model<ArticleDocument>,
    private readonly systemPrompService: SystemPromptsService,
  ) {}

  async create(createPromptTypeDto: CreatePromptTypeDto, userId: string) {
    //verify topic title prompt type already exists
    const topic_prompt = await this.systemPrompService.verifySystemPromptType(
      createPromptTypeDto.titlePrompt,
      SYSTEM_PROMPT_TYPES.TOPIC_TITLE,
    );

    //verify outline prompt type already exists
    const outline_prompt = await this.systemPrompService.verifySystemPromptType(
      createPromptTypeDto.outlinePrompt,
      SYSTEM_PROMPT_TYPES.TOPIC_OUTLINE,
    );

    //verify article prompt type already exists
    const article_prompt = await this.systemPrompService.verifySystemPromptType(
      createPromptTypeDto.articlePrompt,
      SYSTEM_PROMPT_TYPES.ARTICLE,
    );

    //check if prompt type already exists for this user
    const isExistPromptType = await this.promptTypeModel.findOne({
      name: createPromptTypeDto.name,
      user: toObjectId(userId),
      deletedAt: null,
    });
    if (isExistPromptType)
      throw new ConflictException(
        PROMPT_TYPES_STRING.ERROR.PROMPT_TYPE_ALREADY_EXISTS,
      );

    const promptType = new this.promptTypeModel({
      name: createPromptTypeDto.name,
      titlePrompt: topic_prompt._id,
      outlinePrompt: outline_prompt._id,
      articlePrompt: article_prompt._id,
      user: toObjectId(userId),
    });
    return promptType.save();
  }

  // Function overloads to match with the expected return type
  async findAll(
    query: ListPromptTypeQueryPagination,
    userId: string,
  ): Promise<{ promptTypes: PromptType[]; pagination: Pagination }>;
  async findAll(query: ListPromptTypeQuery, userId: string): Promise<PromptType[]>;

  async findAll(
    query: ListPromptTypeQueryPagination | ListPromptTypeQuery,
    userId: string,
  ): Promise<
    { promptTypes: PromptType[]; pagination: Pagination } | PromptType[]
  > {
    const { search } = query;
    
    // Build query with user filter and exclude deleted items
    const mongoQuery: any = { user: toObjectId(userId), deletedAt: null };
    if (search) {
      mongoQuery.name = { $regex: search, $options: 'i' };
    }

    // Check if this is a non-paginated request (no page/limit properties)
    const isPaginated = 'page' in query || 'limit' in query;
    
    if (!isPaginated) {
      const result = await this.promptTypeModel
        .find(mongoQuery)
        .populate('titlePrompt', 'id name')
        .populate('outlinePrompt', 'id name')
        .populate('articlePrompt', 'id name')
        .sort({ name: 1 })
        .exec();
      return result as PromptType[];
    }

    const { page = 1, limit = 10, sort = 'created_at:desc' } = query;
    const total = await this.promptTypeModel.countDocuments(mongoQuery);
    
    // Build sort
    let sortObj: any = { createdAt: -1 };
    if (sort) {
      const [sortBy, sortOrderValue] = sort.split(':');
      if (sortBy && sortOrderValue) {
        const sortOrder = sortOrderValue.toLowerCase() === 'asc' ? 1 : -1;
        
        const sortableColumns: Record<string, string> = {
          name: 'name',
          created_at: 'createdAt',
          updated_at: 'updatedAt',
        };
        
        if (sortableColumns[sortBy]) {
          sortObj = { [sortableColumns[sortBy]]: sortOrder };
        }
      }
    }

    let promptTypes: PromptType[];
    if (typeof limit === 'number' && limit > 0) {
      promptTypes = await this.promptTypeModel
        .find(mongoQuery)
        .populate('titlePrompt', 'id name')
        .populate('outlinePrompt', 'id name')
        .populate('articlePrompt', 'id name')
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
    } else {
      promptTypes = await this.promptTypeModel
        .find(mongoQuery)
        .populate('titlePrompt', 'id name')
        .populate('outlinePrompt', 'id name')
        .populate('articlePrompt', 'id name')
        .sort(sortObj)
        .exec();
    }

    const pagination = {
      total_pages: limit > 0 ? Math.ceil(total / limit) : 1,
      total_records: total,
      current_page: page,
    };

    return {
      promptTypes,
      pagination,
    };
  }

  async findOne(id: string, user?: any) {
    const query: any = { _id: id, deletedAt: null };
    if (user && user._id) {
      query.user = user._id;
    }
    const prompt = await this.promptTypeModel
      .findOne(query)
      .populate('titlePrompt', 'id name')
      .populate('outlinePrompt', 'id name')
      .populate('articlePrompt', 'id name')
      .exec();

    if (!prompt) {
      throw new BadRequestException(
        PROMPT_TYPES_STRING.ERROR.PROMPT_TYPE_NOT_FOUND,
      );
    }
    return prompt;
  }

  async update(id: string, updatePromptTypeDto: CreatePromptTypeDto, userId: string) {
    const promptType = await this.checkIsPromptTypeExists(id, userId);

    //verify topic title prompt type already exists
    const topic_prompt = await this.systemPrompService.verifySystemPromptType(
      updatePromptTypeDto.titlePrompt,
      SYSTEM_PROMPT_TYPES.TOPIC_TITLE,
    );

    //verify outline prompt type already exists
    const outline_prompt = await this.systemPrompService.verifySystemPromptType(
      updatePromptTypeDto.outlinePrompt,
      SYSTEM_PROMPT_TYPES.TOPIC_OUTLINE,
    );

    //verify article prompt type already exists
    const article_prompt = await this.systemPrompService.verifySystemPromptType(
      updatePromptTypeDto.articlePrompt,
      SYSTEM_PROMPT_TYPES.ARTICLE,
    );

    //check if another prompt type with same name exists for this user
    const isExistPromptType = await this.promptTypeModel.findOne({
      name: updatePromptTypeDto.name,
      user: toObjectId(userId),
      _id: { $ne: id },
      deletedAt: null,
    });
    if (isExistPromptType)
      throw new ConflictException(
        PROMPT_TYPES_STRING.ERROR.PROMPT_TYPE_ALREADY_EXISTS,
      );

    const updatedPromptType = await this.promptTypeModel.findOneAndUpdate(
      { _id: id, user: toObjectId(userId) },
      {
        ...updatePromptTypeDto,
        titlePrompt: topic_prompt._id,
        outlinePrompt: outline_prompt._id,
        articlePrompt: article_prompt._id,
      },
      { new: true }
    );

    return updatedPromptType;
  }

  async remove(id: string, userId: string) {
    await this.checkIsPromptTypeExists(id, userId);
    
    // Check if any articles are using this prompt type in their secondary_keywords
    const articlesUsingPromptType = await this.articleModel.countDocuments({
      'secondary_keywords.article_type': id,
      deletedAt: null
    });
    
    if (articlesUsingPromptType > 0) {
      throw new BadRequestException(
        `Cannot delete this article type as it is being used by ${articlesUsingPromptType} article(s). Please remove it from all articles first.`
      );
    }
    
    return this.promptTypeModel.findOneAndUpdate(
      { _id: id, user: toObjectId(userId) },
      { deletedAt: new Date() },
      { new: true }
    );
  }

  private async checkIsPromptTypeExists(id: string, userId?: string) {
    const query: any = { _id: id, deletedAt: null };
    if (userId) {
      query.user = toObjectId(userId);
    }
    const prompt = await this.promptTypeModel.findOne(query);
    if (!prompt) {
      throw new BadRequestException(
        PROMPT_TYPES_STRING.ERROR.PROMPT_TYPE_NOT_FOUND,
      );
    }
    return prompt;
  }
}
