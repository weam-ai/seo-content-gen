import api from '../api';

interface CreateThreadDto {
  text: Array<{ text: string }>;
  type: string;
  metadata: {
    blockId: string;
    markerPosition: {
      from: number;
      to: number;
    };
  };
}

interface AddCommentDto {
  body: Array<{ text: string }>;
}

interface UpdateCommentDto {
  body: Array<{ text: string }>;
  metadata: Record<string, any>;
}

interface UpdatePositionDto {
  position: {
    from: number;
    to: number;
  };
}

class ThreadService {
  // Helper to build headers with optional token
  private static buildHeaders(token?: string) {
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }

  // Thread management
  static async getThreads(docId: string, token?: string) {
    return api.get(`/comments/${docId}/threads`, this.buildHeaders(token));
  }

  static async getThread(threadId: string, token?: string) {
    return api.get(`/comments/threads/${threadId}`, this.buildHeaders(token));
  }

  static async createThread(
    docId: string,
    payload: CreateThreadDto,
    token?: string
  ) {
    return api.post(
      `/comments/${docId}/threads`,
      payload,
      this.buildHeaders(token)
    );
  }

  static async deleteThread(threadId: string, token?: string) {
    return api.delete(
      `/comments/threads/${threadId}`,
      this.buildHeaders(token)
    );
  }

  static async updateThreadPosition(
    threadId: string,
    data: UpdatePositionDto,
    token?: string
  ) {
    return api.patch(
      `/comments/threads/${threadId}/position`,
      data,
      this.buildHeaders(token)
    );
  }

  // Comment management
  static async addComment(
    threadId: string,
    data: AddCommentDto,
    token?: string
  ) {
    return api.post(
      `/comments/threads/${threadId}/comments`,
      data,
      this.buildHeaders(token)
    );
  }

  static async updateComment(
    threadId: string,
    commentId: string,
    data: UpdateCommentDto,
    token?: string
  ) {
    return api.patch(
      `/comments/threads/${threadId}/comments/${commentId}`,
      data,
      this.buildHeaders(token)
    );
  }

  static async deleteComment(
    threadId: string,
    commentId: string,
    token?: string
  ) {
    return api.delete(
      `/comments/threads/${threadId}/comments/${commentId}`,
      this.buildHeaders(token)
    );
  }

  // Thread resolution
  static async resolveThread(threadId: string, token?: string) {
    return api.post(
      `/comments/threads/${threadId}/resolve`,
      {},
      this.buildHeaders(token)
    );
  }

  static async unresolveThread(threadId: string, token?: string) {
    return api.post(
      `/comments/threads/${threadId}/unresolve`,
      {},
      this.buildHeaders(token)
    );
  }

  // Reactions
  static async addReaction(
    threadId: string,
    commentId: string,
    emoji: string,
    token?: string
  ) {
    return api.post(
      `/comments/threads/${threadId}/comments/${commentId}/reactions`,
      { emoji },
      this.buildHeaders(token)
    );
  }

  static async deleteReaction(
    threadId: string,
    commentId: string,
    emoji: string,
    token?: string
  ) {
    return api.delete(
      `/comments/threads/${threadId}/comments/${commentId}/reactions`,
      {
        ...this.buildHeaders(token),
        data: { emoji },
      }
    );
  }
}

export default ThreadService;
