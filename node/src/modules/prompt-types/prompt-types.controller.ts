import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  UseGuards,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { PromptTypesService } from './prompt-types.service';
import { CreatePromptTypeDto } from './dto/create-prompt-type.dto';
import { UpdatePromptTypeDto } from './dto/update-prompt-type.dto';
import {
  acceptedResponse,
  successPaginationResponseWithData,
  successResponseWithData,
} from '@/shared/utils/reponses.utils';
import { Response } from 'express';
import { PROMPT_TYPES_STRING } from '@/shared/utils/string.utils';
import { instanceToPlain } from 'class-transformer';
import {
  ListPromptTypeQuery,
  ListPromptTypeQueryPagination,
} from './dto/list-prompt-types.dto';

@Controller('prompt-types')
export class PromptTypesController {
  constructor(private readonly promptTypesService: PromptTypesService) {}

  @Post()
  async create(
    @Body() createPromptTypeDto: CreatePromptTypeDto,
    @Res() res: Response,
  ) {
    const promptType =
      await this.promptTypesService.create(createPromptTypeDto);
    return successResponseWithData(
      res,
      PROMPT_TYPES_STRING.SUCCESS.PROMPT_TYPE_CREATED,
      promptType,
    );
  }

  @Get('list')
  async findAllList(@Query() query: ListPromptTypeQuery, @Res() res: Response) {
    const promptTypes = await this.promptTypesService.findAll(query);
    
    // Manually serialize to avoid circular reference issues
    const serializedPromptTypes = (promptTypes as any[]).map(promptType => ({
      id: promptType._id.toString(),
      name: promptType.name,
      titlePrompt: promptType.titlePrompt ? {
        id: (promptType.titlePrompt as any)._id?.toString() || promptType.titlePrompt.toString(),
        name: (promptType.titlePrompt as any).name || null
      } : null,
      outlinePrompt: promptType.outlinePrompt ? {
        id: (promptType.outlinePrompt as any)._id?.toString() || promptType.outlinePrompt.toString(),
        name: (promptType.outlinePrompt as any).name || null
      } : null,
      articlePrompt: promptType.articlePrompt ? {
        id: (promptType.articlePrompt as any)._id?.toString() || promptType.articlePrompt.toString(),
        name: (promptType.articlePrompt as any).name || null
      } : null,
      created_at: promptType.created_at,
      updated_at: promptType.updated_at
    }));
    
    return successResponseWithData(
      res,
      PROMPT_TYPES_STRING.SUCCESS.PROMPT_TYPES_FETCHED,
      serializedPromptTypes,
    );
  }

  @Get()
  async findAll(
    @Query() query: ListPromptTypeQueryPagination,
    @Res() res: Response,
  ) {
    const result = await this.promptTypesService.findAll(query);
    
    // Handle both paginated and non-paginated results
    let promptTypes: any[];
    let pagination: any = null;
    
    if (Array.isArray(result)) {
      // Non-paginated result
      promptTypes = result;
    } else {
      // Paginated result
      promptTypes = result.promptTypes;
      pagination = result.pagination;
    }
      
    // Manually serialize to avoid circular reference issues
    const serializedPromptTypes = promptTypes.map(promptType => ({
      id: promptType._id.toString(),
      name: promptType.name,
      titlePrompt: promptType.titlePrompt ? {
        id: (promptType.titlePrompt as any)._id?.toString() || promptType.titlePrompt.toString(),
        name: (promptType.titlePrompt as any).name || null
      } : null,
      outlinePrompt: promptType.outlinePrompt ? {
        id: (promptType.outlinePrompt as any)._id?.toString() || promptType.outlinePrompt.toString(),
        name: (promptType.outlinePrompt as any).name || null
      } : null,
      articlePrompt: promptType.articlePrompt ? {
        id: (promptType.articlePrompt as any)._id?.toString() || promptType.articlePrompt.toString(),
        name: (promptType.articlePrompt as any).name || null
      } : null,
      created_at: promptType.created_at,
      updated_at: promptType.updated_at
    }));
      
    if (pagination) {
      return successPaginationResponseWithData(
        pagination,
        res,
        PROMPT_TYPES_STRING.SUCCESS.PROMPT_TYPES_FETCHED,
        serializedPromptTypes,
      );
    } else {
      return successResponseWithData(
        res,
        PROMPT_TYPES_STRING.SUCCESS.PROMPT_TYPES_FETCHED,
        serializedPromptTypes,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const prompt = await this.promptTypesService.findOne(id);
    if (!prompt) {
      throw new NotFoundException(PROMPT_TYPES_STRING.ERROR.PROMPT_TYPE_NOT_FOUND);
    }
    
    // Manually serialize to avoid circular reference issues
    const serializedPrompt = {
      id: (prompt as any)._id.toString(),
      name: prompt.name,
      titlePrompt: prompt.titlePrompt ? {
        id: (prompt.titlePrompt as any)._id?.toString() || prompt.titlePrompt.toString(),
        name: (prompt.titlePrompt as any).name || null
      } : null,
      outlinePrompt: prompt.outlinePrompt ? {
        id: (prompt.outlinePrompt as any)._id?.toString() || prompt.outlinePrompt.toString(),
        name: (prompt.outlinePrompt as any).name || null
      } : null,
      articlePrompt: prompt.articlePrompt ? {
        id: (prompt.articlePrompt as any)._id?.toString() || prompt.articlePrompt.toString(),
        name: (prompt.articlePrompt as any).name || null
      } : null,
      created_at: (prompt as any).created_at,
      updated_at: (prompt as any).updated_at
    };
    
    return successResponseWithData(
      res,
      PROMPT_TYPES_STRING.SUCCESS.PROMPT_TYPE_FETCHED,
      serializedPrompt,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePromptTypeDto: UpdatePromptTypeDto,
    @Res() res: Response,
  ) {
    const prompt = await this.promptTypesService.update(
      id,
      updatePromptTypeDto as CreatePromptTypeDto,
    );
    if (!prompt) {
      throw new NotFoundException(PROMPT_TYPES_STRING.ERROR.PROMPT_TYPE_NOT_FOUND);
    }
    
    // Manually serialize to avoid circular reference issues
    const serializedPrompt = {
      id: (prompt as any)._id.toString(),
      name: prompt.name,
      titlePrompt: prompt.titlePrompt ? {
        id: (prompt.titlePrompt as any)._id?.toString() || prompt.titlePrompt.toString(),
        name: (prompt.titlePrompt as any).name || null
      } : null,
      outlinePrompt: prompt.outlinePrompt ? {
        id: (prompt.outlinePrompt as any)._id?.toString() || prompt.outlinePrompt.toString(),
        name: (prompt.outlinePrompt as any).name || null
      } : null,
      articlePrompt: prompt.articlePrompt ? {
        id: (prompt.articlePrompt as any)._id?.toString() || prompt.articlePrompt.toString(),
        name: (prompt.articlePrompt as any).name || null
      } : null,
      created_at: (prompt as any).created_at,
      updated_at: (prompt as any).updated_at
    };
    
    return successResponseWithData(
      res,
      PROMPT_TYPES_STRING.SUCCESS.PROMPT_TYPE_UPDATED,
      serializedPrompt,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    await this.promptTypesService.remove(id);
    return acceptedResponse(
      res,
      PROMPT_TYPES_STRING.SUCCESS.PROMPT_TYPE_DELETED,
    );
  }
}
