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
  Req,
} from '@nestjs/common';
import { PromptTypesService } from './prompt-types.service';
import { CreatePromptTypeDto } from './dto/create-prompt-type.dto';
import { UpdatePromptTypeDto } from './dto/update-prompt-type.dto';
import {
  acceptedResponse,
  successPaginationResponseWithData,
  successResponseWithData,
} from '@/shared/utils/reponses.utils';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { getUserId } from '@shared/types/populated-entities';
import { PROMPT_TYPES_STRING } from '@/shared/utils/string.utils';
import { instanceToPlain } from 'class-transformer';
import {
  ListPromptTypeQuery,
  ListPromptTypeQueryPagination,
} from './dto/list-prompt-types.dto';

@Controller('prompt-types')
@UseGuards(JwtAuthGuard)
export class PromptTypesController {
  constructor(private readonly promptTypesService: PromptTypesService) {}

  @Post()
  async create(
    @Body() createPromptTypeDto: CreatePromptTypeDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const promptType =
      await this.promptTypesService.create(createPromptTypeDto, getUserId(req.user!));
    return successResponseWithData(
      res,
      PROMPT_TYPES_STRING.SUCCESS.PROMPT_TYPE_CREATED,
      promptType,
    );
  }

  @Get('list')
  async findAllList(@Query() query: ListPromptTypeQuery, @Req() req: Request, @Res() res: Response) {
    const promptTypes = await this.promptTypesService.findAll(query, getUserId(req.user!));
    
    // Return prompt types with _id fields intact
    return successResponseWithData(
      res,
      PROMPT_TYPES_STRING.SUCCESS.PROMPT_TYPES_FETCHED,
      promptTypes,
    );
  }

  @Get()
  async findAll(
    @Query() query: ListPromptTypeQueryPagination,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.promptTypesService.findAll(query, getUserId(req.user!));
    
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
      
    // Return prompt types with _id fields intact
    if (pagination) {
      return successPaginationResponseWithData(
        pagination,
        res,
        PROMPT_TYPES_STRING.SUCCESS.PROMPT_TYPES_FETCHED,
        promptTypes,
      );
    } else {
      return successResponseWithData(
        res,
        PROMPT_TYPES_STRING.SUCCESS.PROMPT_TYPES_FETCHED,
        promptTypes,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const promptType = await this.promptTypesService.findOne(id, getUserId(req.user!));
    if (!promptType) {
      throw new NotFoundException(PROMPT_TYPES_STRING.ERROR.PROMPT_TYPE_NOT_FOUND);
    }
    
    // Return prompt type with _id field intact
    return successResponseWithData(
      res,
      PROMPT_TYPES_STRING.SUCCESS.PROMPT_TYPE_FETCHED,
      promptType,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePromptTypeDto: UpdatePromptTypeDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const promptType = await this.promptTypesService.update(
      id,
      updatePromptTypeDto as CreatePromptTypeDto,
      getUserId(req.user!),
    );
    if (!promptType) {
      throw new NotFoundException(PROMPT_TYPES_STRING.ERROR.PROMPT_TYPE_NOT_FOUND);
    }
    
    // Return prompt type with _id field intact
    return successResponseWithData(
      res,
      PROMPT_TYPES_STRING.SUCCESS.PROMPT_TYPE_UPDATED,
      prompt,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    await this.promptTypesService.remove(id, getUserId(req.user!));
    return acceptedResponse(
      res,
      PROMPT_TYPES_STRING.SUCCESS.PROMPT_TYPE_DELETED,
    );
  }
}
