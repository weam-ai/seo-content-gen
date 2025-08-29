import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Res,
  Query,
  Post,
  Delete,
} from '@nestjs/common';
import { SystemPromptsService } from './system-prompts.service';
import { UpdateSystemPromptDto } from './dto/update-system-prompt.dto';
import { SYSTEM_PROMPT_STRING } from '@shared/utils/string.utils';
import {
  successPaginationResponseWithData,
  successResponse,
  successResponseWithData,
} from '@shared/utils/reponses.utils';
import { Response } from 'express';

import {
  ListSystemPromptQuery,
  ListSystemPromptQueryPagination,
} from './dto/list-system-prompt.dto';
import { CreateSystemPromptDto } from './dto/create-system-prompt.dto';

@Controller('system-prompts')
export class SystemPromptsController {
  constructor(private readonly SystemPromptsService: SystemPromptsService) {}

  @Post()
  async create(
    @Body() createSystemPromptDto: CreateSystemPromptDto,
    @Res() res: Response,
  ) {
    const Guideline = await this.SystemPromptsService.create(
      createSystemPromptDto,
    );
    // Convert Mongoose document to plain object
    const plainGuideline = {
      id: (Guideline as any)._id.toString(),
      name: (Guideline as any).name,
      type: (Guideline as any).type,
      description: (Guideline as any).description,
      is_default: (Guideline as any).is_default,
      created_at: (Guideline as any).created_at,
      updated_at: (Guideline as any).updated_at
    };
    return successResponseWithData(
      res,
      SYSTEM_PROMPT_STRING.SUCCESS.SYSTEM_PROMPT_CREATED,
      plainGuideline,
    );
  }

  @Get('list')
  async findAllList(
    @Query() query: ListSystemPromptQuery,
    @Res() res: Response,
  ) {
    const SystemPrompts = await this.SystemPromptsService.findAll(query);
    // Convert Mongoose documents to plain objects
    const plainSystemPrompts = SystemPrompts.map((systemPrompt: any) => ({
      id: systemPrompt._id.toString(),
      name: systemPrompt.name,
      type: systemPrompt.type,
      description: systemPrompt.description,
      is_default: systemPrompt.is_default,
      created_at: systemPrompt.created_at,
      updated_at: systemPrompt.updated_at
    }));
    return successResponseWithData(
      res,
      SYSTEM_PROMPT_STRING.SUCCESS.SYSTEM_PROMPT_FETCHED,
      plainSystemPrompts,
    );
  }

  @Get()
  async findAll(
    @Query() query: ListSystemPromptQueryPagination,
    @Res() res: Response,
  ) {
    const result = await this.SystemPromptsService.findAll(query);
    
    // Handle both paginated and non-paginated responses
    if (Array.isArray(result)) {
      // Non-paginated response
      const plainSystemPrompts = result.map((systemPrompt: any) => ({
        id: systemPrompt._id.toString(),
        name: systemPrompt.name,
        type: systemPrompt.type,
        description: systemPrompt.description,
        is_default: systemPrompt.is_default,
        created_at: systemPrompt.created_at,
        updated_at: systemPrompt.updated_at
      }));
      return successResponseWithData(
        res,
        SYSTEM_PROMPT_STRING.SUCCESS.SYSTEM_PROMPT_FETCHED,
        plainSystemPrompts,
      );
    } else {
      // Paginated response
      const { systemPrompts, pagination } = result;
      const plainSystemPrompts = systemPrompts.map((systemPrompt: any) => ({
        id: systemPrompt._id.toString(),
        name: systemPrompt.name,
        type: systemPrompt.type,
        description: systemPrompt.description,
        is_default: systemPrompt.is_default,
        created_at: systemPrompt.created_at,
        updated_at: systemPrompt.updated_at
      }));
      return successPaginationResponseWithData(
        pagination,
        res,
        SYSTEM_PROMPT_STRING.SUCCESS.SYSTEM_PROMPT_FETCHED,
        plainSystemPrompts,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const SystemPrompt = await this.SystemPromptsService.findOne(id);
    // Convert Mongoose document to plain object
    const plainSystemPrompt = {
      id: (SystemPrompt as any)._id.toString(),
      name: (SystemPrompt as any).name,
      type: (SystemPrompt as any).type,
      description: (SystemPrompt as any).description,
      is_default: (SystemPrompt as any).is_default,
      created_at: (SystemPrompt as any).created_at,
      updated_at: (SystemPrompt as any).updated_at
    };
    return successResponseWithData(
      res,
      SYSTEM_PROMPT_STRING.SUCCESS.SYSTEM_PROMPT_FETCHED,
      plainSystemPrompt,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSystemPromptDto: UpdateSystemPromptDto,
    @Res() res: Response,
  ) {
    const SystemPrompt = await this.SystemPromptsService.update(
      id,
      updateSystemPromptDto,
    );
    // Convert Mongoose document to plain object
    const plainSystemPrompt = {
      id: (SystemPrompt as any)._id.toString(),
      name: (SystemPrompt as any).name,
      type: (SystemPrompt as any).type,
      description: (SystemPrompt as any).description,
      is_default: (SystemPrompt as any).is_default,
      created_at: (SystemPrompt as any).created_at,
      updated_at: (SystemPrompt as any).updated_at
    };
    return successResponseWithData(
      res,
      SYSTEM_PROMPT_STRING.SUCCESS.SYSTEM_PROMPT_UPDATED,
      plainSystemPrompt,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    await this.SystemPromptsService.remove(id);
    return successResponse(
      res,
      SYSTEM_PROMPT_STRING.SUCCESS.SYSTEM_PROMPT_DELETED,
    );
  }
}
