// src/events/sse.service.ts
import { Injectable } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class SseService {
  private clients = new Map<string, Response>();

  addClient(requestId: string, res: Response) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
    });
    this.clients.set(requestId, res);
  }

  notifyClient(requestId: string, content: any) {
    const client = this.clients.get(requestId);
    if (client) {
      client.write(
        `data: ${JSON.stringify({
          type: 'content_update',
          requestId,
          content,
        })}\n\n`,
      );
      //   this.removeClient(requestId);
    }
  }

  removeClient(requestId: string) {
    this.clients.delete(requestId);
  }
}