import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateSystemPromptDto } from './dto/update-system-prompt.dto';
import { InjectModel } from '@nestjs/mongoose';
import { SystemPrompt } from './entities/system-prompt.entity';
import { Model } from 'mongoose';
import {
  ListSystemPromptQuery,
  ListSystemPromptQueryPagination,
} from './dto/list-system-prompt.dto';
import { Pagination } from '@shared/types/response.t';
import { SYSTEM_PROMPT_STRING } from '@shared/utils/string.utils';
import { CreateSystemPromptDto } from './dto/create-system-prompt.dto';
import { SYSTEM_PROMPT_TYPES } from '@/shared/types/system-prompt.t';

@Injectable()
export class SystemPromptsService {
  constructor(
    @InjectModel(SystemPrompt.name)
    private readonly systemPromptModel: Model<SystemPrompt>,
  ) {}

  async create(createSystemPromptDto: CreateSystemPromptDto) {
    //check if guideline already exists with same name
    const isExists = await this.systemPromptModel.findOne({
      name: createSystemPromptDto.name,
    });
    if (isExists) {
      throw new ConflictException(
        SYSTEM_PROMPT_STRING.ERROR.SYSTEM_PROMPT_ALREADY_EXISTS,
      );
    }

    //check is there is any same type prompt exists or not to make it default
    const isSameTypePromptExists = await this.systemPromptModel.findOne({
      type: createSystemPromptDto.type,
    });
    if (!isSameTypePromptExists) {
      createSystemPromptDto.is_default = true;
    }

    return await this.systemPromptModel.create(createSystemPromptDto);
  }

  // Function overloads to match with the expected return type
  async findAll(
    query: ListSystemPromptQueryPagination,
  ): Promise<{ systemPrompts: SystemPrompt[]; pagination: Pagination }>;
  async findAll(query: ListSystemPromptQuery): Promise<SystemPrompt[]>;

  // Actual implementation
  async findAll(
    query: ListSystemPromptQuery | ListSystemPromptQueryPagination,
  ): Promise<
    SystemPrompt[] | { systemPrompts: SystemPrompt[]; pagination: Pagination }
  > {
    const { search, type } = query;
    const filter: any = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (type) {
      filter.type = type;
    }

    if (!(query instanceof ListSystemPromptQueryPagination)) {
      const result = await this.systemPromptModel
        .find(filter)
        .select('name type description is_default created_at updated_at')
        .sort({ is_default: -1 })
        .lean()
        .exec();
      return result.map(item => ({
        ...item,
        _id: item._id.toString()
      }));
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
        .select('name type description is_default created_at updated_at')
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
    
    // Transform ObjectIds to strings
    systemPrompts = systemPrompts.map(item => ({
      ...item,
      _id: item._id.toString()
    }));
        

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

  async findOne(id: string): Promise<SystemPrompt> {
    const systemPrompt = await this.systemPromptModel.findById(id).lean().exec();
    if (!systemPrompt) {
      throw new NotFoundException(
        SYSTEM_PROMPT_STRING.ERROR.SYSTEM_PROMPT_NOT_FOUND,
      );
    }
    return {
      ...systemPrompt,
      id: (systemPrompt._id as any).toString()
    } as any;
  }

  async update(id: string, updateSystemPromptDto: UpdateSystemPromptDto) {
    //check if guideline already exists with same name
    const isExists = await this.systemPromptModel.findOne({
      name: updateSystemPromptDto.name,
    }).exec();
    if (isExists && (isExists._id as any).toString() !== id) {
      throw new ConflictException(
        SYSTEM_PROMPT_STRING.ERROR.SYSTEM_PROMPT_ALREADY_EXISTS,
      );
    }

    //If user set is_default true on any specific prompt type, then remove default from existing one
    const defaultTypePrompt = await this.systemPromptModel.findOne({
      type: updateSystemPromptDto.type,
      is_default: true,
    }).exec();

    if (defaultTypePrompt) {
      if (
        updateSystemPromptDto.is_default === true &&
        (defaultTypePrompt._id as any).toString() !== id
      ) {
        defaultTypePrompt.is_default = false;
        await defaultTypePrompt.save();
      } else if (
        updateSystemPromptDto.is_default === false &&
        (defaultTypePrompt._id as any).toString() === id
      ) {
        throw new ConflictException();
      }
    } else {
      updateSystemPromptDto.is_default = true;
    }

    const updatedSystemPrompt = await this.systemPromptModel.findByIdAndUpdate(
      id,
      updateSystemPromptDto,
      { new: true }
    ).lean().exec();
    
    if (!updatedSystemPrompt) {
      throw new NotFoundException(
        SYSTEM_PROMPT_STRING.ERROR.SYSTEM_PROMPT_NOT_FOUND,
      );
    }
    
    return {
      ...updatedSystemPrompt,
      _id: updatedSystemPrompt._id.toString()
    };
  }

  async remove(id: string) {
    const prompt = await this.systemPromptModel.findById(id).exec();
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

    //if this already attached in other entities, the set to default one to them
    // const defaultTypePrompt = await this.systemPromptModel.find({
    //   is_default: true,
    //   type: prompt.type,
    // }).exec();
    // if (defaultTypePrompt) {
    //   const deleteRecords: Record<SYSTEM_PROMPT_TYPES, () => any> = {
    //     article: () => Project.update({}, {}),
    //     topic_outline: () => Article.update({}, {}),
    //     topic_title: () => Article.update({}, {}),
    //   };
    //   deleteRecords[prompt.type]();
    // }

    return await this.systemPromptModel.findByIdAndDelete(id).exec();
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
