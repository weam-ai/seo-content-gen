import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { SseService } from './sse.service';

@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Get(':requestId')
  sse(@Param('requestId') requestId: string, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    this.sseService.addClient(requestId, res);
    res.write(':ok\n\n');
    // Send a heartbeat every 25 seconds
    const heartbeatInterval = setInterval(() => {
      res.write(`event: heartbeat\n\n`);
    }, 25000); // Send heartbeat every 25 seconds

    res.on('close', () => {
      clearInterval(heartbeatInterval); // Stop heartbeat when client disconnects
      this.sseService.removeClient(requestId);
    });
  }
}