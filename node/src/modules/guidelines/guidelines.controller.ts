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
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { getUserId, toObjectId } from '@shared/types/populated-entities';
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
@UseGuards(JwtAuthGuard)
export class GuidelinesController {
  constructor(private readonly guidelinesService: GuidelinesService) {}

  @Post()
  async create(
    @Body() createGuidelineDto: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      
      const guideline = await this.guidelinesService.create(
        createGuidelineDto,
        getUserId(req.user!),
      );
      
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
    return { message: 'Guidelines controller is working' };
  }

  @Post('simple')
  simpleCreate(@Body() body: any) {
    return {
      status: true,
      message: 'Simple endpoint working',
      data: body
    };
  }

  @Post('/test')
  async testCreate(@Res() res: Response) {
    try {
      return res.json({ status: true, message: 'Test endpoint working' });
    } catch (error) {
      console.error('Test endpoint error:', error);
      return res.json({ status: false, message: error.message });
    }
  }

  @Get()
  async findAll(
    @Query() query: ListGuidelineQueryPagination,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { guidelines, pagination } =
      await this.guidelinesService.findAll(query, getUserId(req.user!));
      
    // Guidelines from service now have _id field
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
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const guidelines = await this.guidelinesService.findAllList(query, getUserId(req.user!));
    
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
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const guideline = await this.guidelinesService.findOne(id, getUserId(req.user!));
    
    // Return guideline with _id field intact
    return successResponseWithData(
      res,
      GUIDELINES_STRING.SUCCESS.GUIDELINE_FETCHED,
      guideline,
    );
  }

  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateGuidelineDto: UpdateGuidelineDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const guideline = await this.guidelinesService.update(
      id,
      updateGuidelineDto,
      getUserId(req.user!),
    );
    
    // Return guideline with _id field intact
    return successResponseWithData(
      res,
      GUIDELINES_STRING.SUCCESS.GUIDELINES_UPDATED,
      guideline,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.guidelinesService.remove(id, getUserId(req.user!));
    return successResponse(res, GUIDELINES_STRING.SUCCESS.GUIDELINES_DELETED);
  }
}