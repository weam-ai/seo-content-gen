import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateGuidelineDto } from './dto/create-guideline.dto';
import { UpdateGuidelineDto } from './dto/update-guideline.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Guideline, GuidelineDocument } from './entities/guideline.entity';
import { Project, ProjectDocument } from '../projects/entities/projects.entity';
import { Model } from 'mongoose';
import { GUIDELINES_STRING } from '@shared/utils/string.utils';
import {
  ListGuidelineDtoQuery,
  ListGuidelineQueryPagination,
} from './dto/list-guideline.dto';
import { Pagination } from '@shared/types/response.t';
import { toObjectId } from '@shared/types/populated-entities';

@Injectable()
export class GuidelinesService {
  constructor(
    @InjectModel(Guideline.name)
    private readonly guidelineModel: Model<GuidelineDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async create(createGuidelineDto: any, userId: string): Promise<any> {
    try {
      // Check if guideline with same name already exists for this user
      const existingGuideline = await this.guidelineModel.findOne({
        name: createGuidelineDto.name,
        user: toObjectId(userId),
        deletedAt: null
      });
      
      if (existingGuideline) {
        throw new ConflictException(GUIDELINES_STRING.ERROR.GUIDELINES_ALREADY_EXISTS);
      }
      
      // Create new guideline
      const newGuideline = new this.guidelineModel({
        name: createGuidelineDto.name,
        description: createGuidelineDto.description,
        user: toObjectId(userId)
      });
      
      const savedGuideline = await newGuideline.save();
      
      return savedGuideline;
    } catch (error) {
      console.error('Guidelines create error:', error);
      throw error;
    }
  }

  async findAll(
    query: ListGuidelineQueryPagination,
    userId: string,
  ): Promise<{ guidelines: Guideline[]; pagination: Pagination }> {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
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
    const matchStage: any = { deletedAt: null, user: toObjectId(userId) };
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
        from: 'solution_seo_projects',
        localField: '_id',
        foreignField: 'guideline',
        as: 'projects',
        pipeline: [{ $match: { deletedAt: null } }],
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
      sortStage.createdAt = sortDirection === 'asc' ? 1 : -1;
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
        _id: 1,
        name: 1,
        description: 1,
        project_count: 1,
        created_at: '$createdAt',
        updated_at: '$updatedAt',
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

  async findAllList(query: ListGuidelineDtoQuery, userId: string): Promise<Guideline[]> {
    const { search } = query;
    const matchStage: any = { deletedAt: null, user: toObjectId(userId) };
    
    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    return this.guidelineModel
      .find(matchStage)
      .select('_id name description createdAt updatedAt')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, user?: any): Promise<Guideline> {
    const query: any = {
      _id: id,
      deletedAt: null,
    };
    if (user && user._id) {
      query.user = user._id;
    }
    const guideline = await this.guidelineModel.findOne(query);
    if (!guideline) {
      throw new NotFoundException(GUIDELINES_STRING.ERROR.GUIDELINES_NOT_FOUND);
    }
    return guideline;
  }

  async update(
    id: string,
    updateGuidelineDto: UpdateGuidelineDto,
    userId: string,
  ): Promise<Guideline> {
    // Check if guideline already exists with same name for this user
    if (updateGuidelineDto.name) {
      const isExists = await this.guidelineModel.findOne({
        name: updateGuidelineDto.name,
        _id: { $ne: id },
        user: toObjectId(userId),
        deletedAt: null,
      });
      if (isExists) {
        throw new ConflictException(
          GUIDELINES_STRING.ERROR.GUIDELINES_ALREADY_EXISTS,
        );
      }
    }

    const guideline = await this.findOne(id, { _id: userId });
    const updatedGuideline = await this.guidelineModel.findOneAndUpdate(
      { _id: id, user: toObjectId(userId), deletedAt: null },
      updateGuidelineDto,
      { new: true },
    );

    if (!updatedGuideline) {
      throw new NotFoundException(GUIDELINES_STRING.ERROR.GUIDELINES_NOT_FOUND);
    }

    return updatedGuideline;
  }

  async remove(id: string, userId: string): Promise<void> {
    const guideline = await this.findOne(id, { _id: toObjectId(userId) });
    
    // Check if any projects are using this guideline
    const projectsUsingGuideline = await this.projectModel.countDocuments({
      guideline: toObjectId(id),
      deletedAt: null,
    });
    
    if (projectsUsingGuideline > 0) {
      throw new BadRequestException(
        `Cannot delete guideline. It is currently being used by ${projectsUsingGuideline} project(s). Please remove the guideline from all projects before deleting it.`
      );
    }
    
    await this.guidelineModel.findOneAndUpdate(
      { _id: id, user: toObjectId(userId), deletedAt: null },
      { deletedAt: new Date() },
    );
  }
}