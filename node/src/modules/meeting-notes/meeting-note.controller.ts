import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  Res,
  Req,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { MeetingNotesService } from './meeting-note.service';
import { MeetingNotesStatsDto } from './dto/meeting-notes-stats.dto';
import { CreateMeetingNoteDto } from './dto/create-meeting-note.dto';
import { UpdateMeetingNoteDto } from './dto/update-meeting-note.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import {
  successResponseWithData,
  successResponse,
} from '@shared/utils/reponses.utils';
import { Request, Response } from 'express';
import { PopulatedUser } from '@shared/types/populated-entities';
// Meeting notes strings - simplified for single user
const MEETING_NOTES_STRING = {
  SUCCESS: {
    MEETING_NOTES_FETCHED: 'Meeting notes fetched successfully',
    MEETING_NOTE_CREATED: 'Meeting note created successfully',
    MEETING_NOTE_UPDATED: 'Meeting note updated successfully',
    MEETING_NOTE_DELETED: 'Meeting note deleted successfully'
  },
  ERROR: {
    MEETING_NOTE_NOT_FOUND: 'Meeting note not found'
  }
};

@Controller('meeting-notes')
@UseGuards(JwtAuthGuard)
export class MeetingNotesController {
  constructor(private readonly meetingNotesService: MeetingNotesService) {}

  @Get()
  async getMeetingNotes(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: MeetingNotesStatsDto,
  ) {
    const result = await this.meetingNotesService.getMeetingNotes(
      query,
      req.user as unknown as PopulatedUser,
    );

    return successResponseWithData(
      res,
      MEETING_NOTES_STRING.SUCCESS.MEETING_NOTES_FETCHED,
      result,
    );
  }

  @Post()
  async createMeetingNote(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createMeetingNoteDto: CreateMeetingNoteDto,
  ) {
    await this.meetingNotesService.createMeetingNote(
      createMeetingNoteDto,
      req.user! as unknown as PopulatedUser,
    );

    return successResponse(
      res,
      MEETING_NOTES_STRING.SUCCESS.MEETING_NOTE_CREATED,
    );
  }

  @Patch(':id')
  async updateMeetingNote(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() updateMeetingNoteDto: UpdateMeetingNoteDto,
  ) {
    await this.meetingNotesService.updateMeetingNote(
      id,
      updateMeetingNoteDto,
      req.user! as unknown as PopulatedUser,
    );

    return successResponse(
      res,
      MEETING_NOTES_STRING.SUCCESS.MEETING_NOTE_UPDATED,
    );
  }

  @Delete(':id')
  async deleteMeetingNote(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    await this.meetingNotesService.deleteMeetingNote(id, req.user! as unknown as PopulatedUser);

    return successResponse(
      res,
      MEETING_NOTES_STRING.SUCCESS.MEETING_NOTE_DELETED,
    );
  }
}
