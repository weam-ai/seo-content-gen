import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MeetingNote, MeetingNoteDocument } from './entities/meeting-note.entity';
import { User } from '../users/entities/user.entity';
import { MeetingNotesStatsDto } from './dto/meeting-notes-stats.dto';
import { CreateMeetingNoteDto } from './dto/create-meeting-note.dto';
import { UpdateMeetingNoteDto } from './dto/update-meeting-note.dto';
// import { ROLES_TYPES } from '@shared/types/roles.t';
// import { MEETING_NOTES_STRING } from '@shared/utils/string.utils';

import { Types } from 'mongoose';

// Constants for single-user application (simplified)

const MEETING_NOTES_STRING = {
  ERROR: {
    MEETING_NOTE_NOT_FOUND: 'Meeting note not found',
    UNAUTHORIZED_UPDATE: 'Unauthorized to update this meeting note',
    UNAUTHORIZED_DELETE: 'Unauthorized to delete this meeting note'
  }
};

// Import PopulatedUser from shared types
import { PopulatedUser } from '@/shared/types/populated-entities';

// Removed agency-related interfaces for single-user application
// - MeetingNotesOverview (agency stats)
// - AgencyStats (agency-specific data)
// - DateStats (kept simple date tracking)

export interface DateStats {
  date: string;
  notes_count: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_records: number;
    per_page: number;
  };
}

@Injectable()
export class MeetingNotesService {
  constructor(
    @InjectModel(MeetingNote.name)
    private readonly meetingNoteModel: Model<MeetingNoteDocument>,
  ) {}

  async getMeetingNotes(
    query: MeetingNotesStatsDto,
    user?: PopulatedUser,
  ): Promise<PaginatedResult<MeetingNote>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const filter: any = {
      deleted_at: { $exists: false },
    };

    // Filter by current user (single-user application)
    if (user) {
      filter.user = user._id;
    }

    if (query.meeting_date) {
      const date = new Date(query.meeting_date);
      filter.meeting_date = {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999)),
      };
    }

    if (query.start_date) {
      filter.meeting_date = {
        ...filter.meeting_date,
        $gte: new Date(query.start_date),
      };
    }

    if (query.end_date) {
      filter.meeting_date = {
        ...filter.meeting_date,
        $lte: new Date(query.end_date),
      };
    }

    if (query.project_id) {
      filter.project = query.project_id;
    }

    if (query.search) {
      filter.$or = [
        { agenda: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    // Removed staff_id filtering for single-user application

    // Build sort options
    let sort: any = { created_at: -1 };
    if (query.sort) {
      const [field, order] = query.sort.split(':');
      sort = { [field]: order.toLowerCase() === 'desc' ? -1 : 1 };
    }

    // Execute query with pagination
    const queryBuilder = this.meetingNoteModel
      .find(filter)
      .populate('user', 'firstname lastname')
      .populate('project', 'name')
      .sort(sort);

    if (limit !== 0 && limit !== -1) {
      queryBuilder.skip(skip).limit(limit);
    }

    const [data, total] = await Promise.all([
      queryBuilder.exec(),
      this.meetingNoteModel.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        current_page: page,
        total_pages: limit === 0 || limit === -1 ? 1 : Math.ceil(total / limit),
        total_records: total,
        per_page: limit,
      },
    };
  }

  async createMeetingNote(
    createMeetingNoteDto: CreateMeetingNoteDto,
    _user: PopulatedUser,
  ): Promise<MeetingNote> {
    const meetingNoteData = {
      ...createMeetingNoteDto,
      meeting_date: new Date(createMeetingNoteDto.meeting_date),
      user: _user._id,
      project: createMeetingNoteDto.project_id || undefined,
    };

    // Remove fields that shouldn't be in the document
    delete (meetingNoteData as any).project_id;
    delete (meetingNoteData as any).agency_id; // Removed for single-user app

    const meetingNote = new this.meetingNoteModel(meetingNoteData);
    return await meetingNote.save();
  }

  async updateMeetingNote(
    id: string,
    updateMeetingNoteDto: UpdateMeetingNoteDto,
    user: PopulatedUser,
  ): Promise<MeetingNote> {
    const meetingNote = await this.meetingNoteModel
      .findOne({
        _id: id,
        deleted_at: { $exists: false },
      })
      .populate('user');

    if (!meetingNote) {
      throw new NotFoundException(
        MEETING_NOTES_STRING.ERROR.MEETING_NOTE_NOT_FOUND,
      );
    }

    // Check if user owns this meeting note (single-user application)
    if (meetingNote.user.toString() !== user._id?.toString()) {
      throw new ForbiddenException(
        MEETING_NOTES_STRING.ERROR.UNAUTHORIZED_UPDATE,
      );
    }

    const updateData: any = { ...updateMeetingNoteDto };

    if (updateMeetingNoteDto.meeting_date) {
      updateData.meeting_date = new Date(updateMeetingNoteDto.meeting_date);
    }

    if (updateMeetingNoteDto.project_id) {
      updateData.project = updateMeetingNoteDto.project_id;
      delete updateData.project_id;
    }

    // Remove agency_id for single-user app
    delete updateData.agency_id;

    const updatedMeetingNote = await this.meetingNoteModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('user', 'firstname lastname')
      .populate('project', 'name');

    return updatedMeetingNote!;
  }

  async deleteMeetingNote(id: string, user: PopulatedUser): Promise<void> {
    const meetingNote = await this.meetingNoteModel
      .findOne({
        _id: id,
        deleted_at: { $exists: false },
      })
      .populate('user');

    if (!meetingNote) {
      throw new NotFoundException(
        MEETING_NOTES_STRING.ERROR.MEETING_NOTE_NOT_FOUND,
      );
    }

    // Check if user owns this meeting note (single-user application)
    if (meetingNote.user.toString() !== user._id?.toString()) {
      throw new ForbiddenException(
        MEETING_NOTES_STRING.ERROR.UNAUTHORIZED_DELETE,
      );
    }

    // Soft delete by setting deleted_at
    await this.meetingNoteModel.findByIdAndUpdate(id, {
      deleted_at: new Date(),
    });
  }
}
