import { successResponseWithData } from '@shared/utils/reponses.utils';
import { GLOBAL_STRING } from '@shared/utils/string.utils';
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import CONST_TIMEZONES from '../../static/timezones.json';

@Controller('global')
export class GlobalController {
  @Get('timezones')
  getTimezones(@Res() res: Response) {
    return successResponseWithData(
      res,
      GLOBAL_STRING.SUCCESS.TIMEZONES_FETCHED,
      CONST_TIMEZONES,
    );
  }
}
