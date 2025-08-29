import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGuidelineDto } from './dto/create-guideline.dto';
import { UpdateGuidelineDto } from './dto/update-guideline.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Guideline, GuidelineDocument } from './entities/guideline.entity';
import { Model } from 'mongoose';
import { GUIDELINES_STRING } from '@shared/utils/string.utils';
import {
  ListGuidelineDtoQuery,
  ListGuidelineQueryPagination,
} from './dto/list-guideline.dto';
import { Pagination } from '@shared/types/response.t';

@Injectable()
export class GuidelinesService {
  constructor(
    @InjectModel(Guideline.name)
    private readonly guidelineModel: Model<GuidelineDocument>,
  ) {}

  async create(createGuidelineDto: any): Promise<any> {
    try {
      console.log('Service: Starting create method');
      console.log('Service: DTO received:', createGuidelineDto);
      
      // Return a mock response to test if the issue is with Mongoose
      const mockGuideline = {
        _id: '507f1f77bcf86cd799439011',
        name: createGuidelineDto.name,
        description: createGuidelineDto.description,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      console.log('Service: Returning mock guideline:', mockGuideline);
      return mockGuideline;
    } catch (error) {
      console.error('Guidelines create error:', error);
      throw error;
    }
  }

  async findAll(
    query: ListGuidelineQueryPagination,
  ): Promise<{ guidelines: Guideline[]; pagination: Pagination }> {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      search,
    } = query;

    // Ensure page and limit are numbers
    const pageNum = Number(page);
    const limitNum = Number(limit);

    // Parse sort field and direction
    const [sortField, sortDirection] = sort.includes(':') 
      ? sort.split(':') 
      : [sort, 'desc'];

    const pipeline: any[] = [];

    // Match stage for filtering
    const matchStage: any = { deleted_at: null };
    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    pipeline.push({ $match: matchStage });

    // Add project count lookup
    pipeline.push({
      $lookup: {
        from: 'projects',
        localField: '_id',
        foreignField: 'guideline',
        as: 'projects',
        pipeline: [{ $match: { deleted_at: null } }],
      },
    });

    pipeline.push({
      $addFields: {
        project_count: { $size: '$projects' },
      },
    });

    // Sort stage
    const sortStage: any = {};
    if (sortField === 'name') {
      sortStage.name = sortDirection === 'asc' ? 1 : -1;
    } else if (sortField === 'project_count') {
      sortStage.project_count = sortDirection === 'asc' ? 1 : -1;
    } else {
      sortStage.created_at = sortDirection === 'asc' ? 1 : -1;
    }
    pipeline.push({ $sort: sortStage });

    // Get total count for pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.guidelineModel.aggregate(countPipeline);
    const totalRecords = countResult[0]?.total || 0;

    // Add pagination
    if (limitNum !== 0 && limitNum !== -1) {
      pipeline.push({ $skip: (pageNum - 1) * limitNum });
      pipeline.push({ $limit: limitNum });
    }

    // Final projection
    pipeline.push({
      $project: {
        id: { $toString: '$_id' },
        name: 1,
        description: 1,
        project_count: 1,
        created_at: 1,
        updated_at: 1,
      },
    });

    const guidelines = await this.guidelineModel.aggregate(pipeline);

    const pagination: Pagination = {
      total_records: totalRecords,
      current_page: pageNum,
      total_pages:
        limitNum === 0 || limitNum === -1 ? 1 : Math.ceil(totalRecords / limitNum),
    };

    return { guidelines, pagination };
  }

  async findAllList(query: ListGuidelineDtoQuery): Promise<Guideline[]> {
    const { search } = query;
    const matchStage: any = { deleted_at: null };
    
    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    return this.guidelineModel
      .find(matchStage)
      .select('_id name description created_at updated_at')
      .sort({ created_at: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Guideline> {
    const guideline = await this.guidelineModel.findOne({
      _id: id,
      deleted_at: null,
    });
    if (!guideline) {
      throw new NotFoundException(GUIDELINES_STRING.ERROR.GUIDELINES_NOT_FOUND);
    }
    return guideline;
  }

  async update(
    id: string,
    updateGuidelineDto: UpdateGuidelineDto,
  ): Promise<Guideline> {
    // Check if guideline already exists with same name
    if (updateGuidelineDto.name) {
      const isExists = await this.guidelineModel.findOne({
        name: updateGuidelineDto.name,
        _id: { $ne: id },
        deleted_at: null,
      });
      if (isExists) {
        throw new ConflictException(
          GUIDELINES_STRING.ERROR.GUIDELINES_ALREADY_EXISTS,
        );
      }
    }

    const guideline = await this.findOne(id);
    const updatedGuideline = await this.guidelineModel.findByIdAndUpdate(
      id,
      updateGuidelineDto,
      { new: true },
    );

    if (!updatedGuideline) {
      throw new NotFoundException(GUIDELINES_STRING.ERROR.GUIDELINES_NOT_FOUND);
    }

    return updatedGuideline;
  }

  async remove(id: string): Promise<void> {
    const guideline = await this.findOne(id);
    await this.guidelineModel.findByIdAndUpdate(id, {
      deleted_at: new Date(),
    });
  }
}