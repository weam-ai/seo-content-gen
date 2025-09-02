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
  UseGuards,
  Req,
} from '@nestjs/common';
import { SystemPromptsService } from './system-prompts.service';
import { UpdateSystemPromptDto } from './dto/update-system-prompt.dto';
import { SYSTEM_PROMPT_STRING } from '@shared/utils/string.utils';
import {
  successPaginationResponseWithData,
  successResponse,
  successResponseWithData,
} from '@shared/utils/reponses.utils';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { getUserId, toObjectId } from '@shared/types/populated-entities';

import {
  ListSystemPromptQuery,
  ListSystemPromptQueryPagination,
} from './dto/list-system-prompt.dto';
import { CreateSystemPromptDto } from './dto/create-system-prompt.dto';

@Controller('system-prompts')
@UseGuards(JwtAuthGuard)
export class SystemPromptsController {
  constructor(private readonly SystemPromptsService: SystemPromptsService) {}

  @Post()
  async create(
    @Body() createSystemPromptDto: CreateSystemPromptDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const systemPrompt = await this.SystemPromptsService.create(
      createSystemPromptDto,
      toObjectId(getUserId(req.user!)),
    );
    // Return system prompt with _id field intact
    return successResponseWithData(
      res,
      SYSTEM_PROMPT_STRING.SUCCESS.SYSTEM_PROMPT_CREATED,
      systemPrompt,
    );
  }

  @Get('list')
  async findAllList(
    @Query() query: ListSystemPromptQuery,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const systemPrompts = await this.SystemPromptsService.findAll(query, toObjectId(getUserId(req.user!)));
    // Return system prompts with _id fields intact
    return successResponseWithData(
      res,
      SYSTEM_PROMPT_STRING.SUCCESS.SYSTEM_PROMPT_FETCHED,
      systemPrompts,
    );
  }

  @Get()
  async findAll(
    @Query() query: ListSystemPromptQueryPagination,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.SystemPromptsService.findAll(query, toObjectId(getUserId(req.user!)));
    
    // Handle both paginated and non-paginated responses
    if (Array.isArray(result)) {
      // Non-paginated response - return with _id fields intact
      return successResponseWithData(
        res,
        SYSTEM_PROMPT_STRING.SUCCESS.SYSTEM_PROMPT_FETCHED,
        result,
      );
    } else {
      // Paginated response - return with _id fields intact
      const { systemPrompts, pagination } = result;
      return successPaginationResponseWithData(
        pagination,
        res,
        SYSTEM_PROMPT_STRING.SUCCESS.SYSTEM_PROMPT_FETCHED,
        systemPrompts,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const systemPrompt = await this.SystemPromptsService.findOne(id, toObjectId(getUserId(req.user!)));
    // Return system prompt with _id field intact
    return successResponseWithData(
      res,
      SYSTEM_PROMPT_STRING.SUCCESS.SYSTEM_PROMPT_FETCHED,
      systemPrompt,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSystemPromptDto: UpdateSystemPromptDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const systemPrompt = await this.SystemPromptsService.update(
      id,
      updateSystemPromptDto,
      toObjectId(getUserId(req.user!)),
    );
    // Return system prompt with _id field intact
    return successResponseWithData(
      res,
      SYSTEM_PROMPT_STRING.SUCCESS.SYSTEM_PROMPT_UPDATED,
      systemPrompt,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    await this.SystemPromptsService.remove(id, toObjectId(getUserId(req.user!)));
    return successResponse(
      res,
      SYSTEM_PROMPT_STRING.SUCCESS.SYSTEM_PROMPT_DELETED,
    );
  }
}
