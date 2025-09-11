// src/events/sse.service.ts
import { Injectable } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class SseService {
  private clients = new Map<string, Response>();

  addClient(articleId: string, res: Response) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
    });
    this.clients.set(articleId, res);
  }

  notifyClient(articleId: string, content: any) {
    const client = this.clients.get(articleId);
    if (client) {
      client.write(
        `data: ${JSON.stringify({
          type: 'content_update',
          articleId,
          content,
        })}\n\n`,
      );
    }
  }

  removeClient(articleId: string) {
    this.clients.delete(articleId);
  }
}