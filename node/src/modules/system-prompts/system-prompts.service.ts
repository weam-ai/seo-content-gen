import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateSystemPromptDto } from './dto/update-system-prompt.dto';
import { InjectModel } from '@nestjs/mongoose';
import { SystemPrompt } from './entities/system-prompt.entity';
import { Model, Types } from 'mongoose';
import {
  ListSystemPromptQuery,
  ListSystemPromptQueryPagination,
} from './dto/list-system-prompt.dto';
import { Pagination } from '@shared/types/response.t';
import { SYSTEM_PROMPT_STRING } from '@shared/utils/string.utils';
import { CreateSystemPromptDto } from './dto/create-system-prompt.dto';
import { SYSTEM_PROMPT_TYPES } from '@/shared/types/system-prompt.t';
import { toObjectId } from '@/shared/types/populated-entities';
import { PromptType, PromptTypeDocument } from '../prompt-types/entities/prompt-type.entity';

@Injectable()
export class SystemPromptsService {
  constructor(
    @InjectModel(SystemPrompt.name)
    private readonly systemPromptModel: Model<SystemPrompt>,
    @InjectModel(PromptType.name)
    private readonly promptTypeModel: Model<PromptTypeDocument>,
  ) {}

  async create(createSystemPromptDto: CreateSystemPromptDto, userId: Types.ObjectId) {
    //check if guideline already exists with same name for this user
    const isExists = await this.systemPromptModel.findOne({
      name: createSystemPromptDto.name,
      user: toObjectId(userId),
    });
    if (isExists) {
      throw new ConflictException(
        SYSTEM_PROMPT_STRING.ERROR.SYSTEM_PROMPT_ALREADY_EXISTS,
      );
    }

    //check is there is any same type prompt exists or not to make it default for this user
    const isSameTypePromptExists = await this.systemPromptModel.findOne({
      type: createSystemPromptDto.type,
      user: toObjectId(userId),
    });
    if (!isSameTypePromptExists) {
      createSystemPromptDto.is_default = true;
    }

    return await this.systemPromptModel.create({
      ...createSystemPromptDto,
      user: toObjectId(userId),
    });
  }

  // Function overloads to match with the expected return type
  async findAll(
    query: ListSystemPromptQueryPagination,
    userId: Types.ObjectId,
  ): Promise<{ systemPrompts: SystemPrompt[]; pagination: Pagination }>;
  async findAll(query: ListSystemPromptQuery, userId: Types.ObjectId): Promise<SystemPrompt[]>;

  // Actual implementation
  async findAll(
    query: ListSystemPromptQuery | ListSystemPromptQueryPagination,
    userId: Types.ObjectId,
  ): Promise<
    SystemPrompt[] | { systemPrompts: SystemPrompt[]; pagination: Pagination }
  > {
    const { search, type } = query;
    const filter: any = { user: toObjectId(userId) };

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (type) {
      filter.type = type;
    }

    if (!(query instanceof ListSystemPromptQueryPagination)) {
      const result = await this.systemPromptModel
        .find(filter)
        .select('name type description is_default createdAt updatedAt')
        .sort({ is_default: -1 })
        .lean()
        .exec();
      return result;
    }

    const total = await this.systemPromptModel.countDocuments(filter);

    // Pagination and sorting
    const { page = 1, limit = 10, sort = 'created_at:desc' } = query;
    const sortBy = sort.split(':')[0];
    const sortOrder = sort.split(':')[1];

    let sortObj: any = {};
    if (sortBy && sortOrder) {
      if (
        ['id', 'name', 'type', 'created_at', 'updated_at', 'is_default'].includes(
          sortBy,
        ) &&
        ['asc', 'desc'].includes(sortOrder)
      ) {
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
      }
    }

    let systemPrompts;
    if (typeof limit === 'number' && limit > 0) {
      systemPrompts = await this.systemPromptModel
        .find(filter)
        .select('name type description is_default createdAt updatedAt')
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec();
    } else {
      systemPrompts = await this.systemPromptModel
        .find(filter)
        .select('name type description is_default created_at updated_at')
        .sort(sortObj)
        .lean()
        .exec();
    }
    
    // Return system prompts with _id fields intact
        

    const pagination: Pagination = {
      total_pages: limit > 0 ? Math.ceil(total / limit) : 1,
      total_records: total,
      current_page: page,
    };

    return {
      systemPrompts,
      pagination,
    };
  }

  async findOne(id: string, user?: any): Promise<SystemPrompt> {
    const query: any = { _id: id };
    if (user && user._id) {
      query.user = toObjectId(user._id);
    }
    const systemPrompt = await this.systemPromptModel.findOne(query).lean().exec();
    if (!systemPrompt) {
      throw new NotFoundException(
        SYSTEM_PROMPT_STRING.ERROR.SYSTEM_PROMPT_NOT_FOUND,
      );
    }
    return systemPrompt;
  }

  async update(id: string, updateSystemPromptDto: UpdateSystemPromptDto, userId: Types.ObjectId) {
    //check if guideline already exists with same name for this user
    const isExists = await this.systemPromptModel.findOne({
      name: updateSystemPromptDto.name,
      user: toObjectId(userId),
    }).exec();
    if (isExists && isExists._id.toString() !== id) {
      throw new ConflictException(
        SYSTEM_PROMPT_STRING.ERROR.SYSTEM_PROMPT_ALREADY_EXISTS,
      );
    }

    //If user set is_default true on any specific prompt type, then remove default from existing one for this user
    const defaultTypePrompt = await this.systemPromptModel.findOne({
      type: updateSystemPromptDto.type,
      user: toObjectId(userId),
      is_default: true,
    }).exec();

    if (defaultTypePrompt) {
      if (
        updateSystemPromptDto.is_default === true &&
        defaultTypePrompt._id.toString() !== id
      ) {
        defaultTypePrompt.is_default = false;
        await defaultTypePrompt.save();
      } else if (
        updateSystemPromptDto.is_default === false &&
        defaultTypePrompt._id.toString() === id
      ) {
        throw new ConflictException();
      }
    } else {
      updateSystemPromptDto.is_default = true;
    }

    const updatedSystemPrompt = await this.systemPromptModel.findOneAndUpdate(
      { _id: id, user: toObjectId(userId) },
      updateSystemPromptDto,
      { new: true }
    ).lean().exec();
    
    if (!updatedSystemPrompt) {
      throw new NotFoundException(
        SYSTEM_PROMPT_STRING.ERROR.SYSTEM_PROMPT_NOT_FOUND,
      );
    }
    
    return updatedSystemPrompt;
  }

  async remove(id: string, userId: Types.ObjectId) {
    const prompt = await this.systemPromptModel.findOne({ _id: id, user: toObjectId(userId) }).exec();
    if (!prompt) {
      throw new NotFoundException(
        SYSTEM_PROMPT_STRING.ERROR.SYSTEM_PROMPT_NOT_FOUND,
      );
    }

    //do not allow delete default prompt until he set default to another prompt
    if (prompt.is_default) {
      throw new ConflictException(
        SYSTEM_PROMPT_STRING.ERROR.SYSTEM_PROMPT_DEFAULT_NO_DELETE,
      );
    }

    // Check if this system prompt is being used by any prompt types
    const promptTypesUsingThisPrompt = await this.promptTypeModel.countDocuments({
      $or: [
        { titlePrompt: id },
        { outlinePrompt: id },
        { articlePrompt: id }
      ],
      deletedAt: null
    });

    if (promptTypesUsingThisPrompt > 0) {
      throw new BadRequestException(
        `Cannot delete this system prompt as it is being used by ${promptTypesUsingThisPrompt} article type(s). Please update the article types to use a different system prompt first.`
      );
    }

    return await this.systemPromptModel.findOneAndDelete({ _id: id, user: toObjectId(userId) }).exec();
  }

  async verifySystemPromptType(id: string, type: SYSTEM_PROMPT_TYPES) {
    const systemPrompt = await this.systemPromptModel.findOne({
      _id: id,
      type,
    }).exec();

    if (!systemPrompt) {
      throw new BadRequestException(
        SYSTEM_PROMPT_STRING.ERROR.SYSTEM_PROMPT_NOT_FOUND,
      );
    }

    return systemPrompt;
  }
}
