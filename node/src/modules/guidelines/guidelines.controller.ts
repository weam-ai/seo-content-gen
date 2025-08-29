import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ParseObjectIdPipe } from '@shared/pipes/parse-objectid.pipe';
import { GuidelinesService } from './guidelines.service';
import { CreateGuidelineDto } from './dto/create-guideline.dto';
import { UpdateGuidelineDto } from './dto/update-guideline.dto';
import { ListGuidelineDtoQuery, ListGuidelineQueryPagination } from './dto/list-guideline.dto';
import {
  successPaginationResponseWithData,
  successResponseWithData,
  successResponse,
  ErrorResponse,
} from '@shared/utils/reponses.utils';
import { instanceToPlain } from 'class-transformer';
import { GUIDELINES_STRING } from '@shared/utils/string.utils';
@Controller('guidelines')
export class GuidelinesController {
  constructor(private readonly guidelinesService: GuidelinesService) {}

  @Post()
  async create(
    @Body() createGuidelineDto: any,
    @Res() res: Response,
  ) {
    try {
      console.log('Controller: Starting create method');
      console.log('Controller: DTO received:', createGuidelineDto);
      
      const guideline = await this.guidelinesService.create(
        createGuidelineDto,
      );
      
      console.log('Controller: Service returned:', guideline);
      
      return res.json({
        status: true,
        message: 'Guideline created successfully',
        data: guideline
      });
    } catch (error) {
      console.error('Controller: Error caught:', error);
      return ErrorResponse(res, { msg: error.message });
    }
  }

  @Get('test')
  test() {
    console.log('Test endpoint reached');
    return { message: 'Guidelines controller is working' };
  }

  @Post('simple')
  simpleCreate(@Body() body: any) {
    console.log('Simple create endpoint reached:', body);
    return {
      status: true,
      message: 'Simple endpoint working',
      data: body
    };
  }

  @Post('/test')
  async testCreate(@Res() res: Response) {
    try {
      console.log('Test endpoint called');
      return res.json({ status: true, message: 'Test endpoint working' });
    } catch (error) {
      console.error('Test endpoint error:', error);
      return res.json({ status: false, message: error.message });
    }
  }

  @Get()
  async findAll(
    @Query() query: ListGuidelineQueryPagination,
    @Res() res: Response,
  ) {
    const { guidelines, pagination } =
      await this.guidelinesService.findAll(query);
      
    // Guidelines from service already have proper format with id field
    return successPaginationResponseWithData(
      pagination,
      res,
      GUIDELINES_STRING.SUCCESS.GUIDELINES_FETCHED,
      guidelines,
    );
  }

  @Get('list')
  async listAllGuidelines(
    @Query() query: ListGuidelineDtoQuery,
    @Res() res: Response,
  ) {
    const guidelines = await this.guidelinesService.findAllList(query);
    
    // Manually serialize to match original app format
    const serializedGuidelines = (guidelines as any[]).map(guideline => ({
      id: guideline._id.toString(),
      name: guideline.name,
      description: guideline.description,
      created_at: guideline.created_at,
      updated_at: guideline.updated_at
    }));
    
    return successResponseWithData(
      res,
      GUIDELINES_STRING.SUCCESS.GUIDELINE_FETCHED,
      serializedGuidelines,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @Res() res: Response,
  ) {
    const guideline = await this.guidelinesService.findOne(id);
    
    // Manually serialize to match original app format
    const serializedGuideline = {
      id: (guideline as any)._id.toString(),
      name: guideline.name,
      description: guideline.description,
      created_at: (guideline as any).created_at,
      updated_at: (guideline as any).updated_at
    };
    
    return successResponseWithData(
      res,
      GUIDELINES_STRING.SUCCESS.GUIDELINE_FETCHED,
      serializedGuideline,
    );
  }

  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateGuidelineDto: UpdateGuidelineDto,
    @Res() res: Response,
  ) {
    const guideline = await this.guidelinesService.update(
      id,
      updateGuidelineDto,
    );
    
    // Manually serialize to match original app format
    const serializedGuideline = {
      id: (guideline as any)._id.toString(),
      name: guideline.name,
      description: guideline.description,
      created_at: (guideline as any).created_at,
      updated_at: (guideline as any).updated_at
    };
    
    return successResponseWithData(
      res,
      GUIDELINES_STRING.SUCCESS.GUIDELINES_UPDATED,
      serializedGuideline,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @Res() res: Response,
  ) {
    await this.guidelinesService.remove(id);
    return successResponse(res, GUIDELINES_STRING.SUCCESS.GUIDELINES_DELETED);
  }
}