import ThreadService from '@/lib/services/ThreadService';

export class CommentSystem {
  private cachedThreads: Record<string, any> = {};
  private docId: string | null = null;
  private token: string | null = null;

  // Set current document ID
  setDocumentId(docId: string) {
    this.docId = docId;
  }

  // Set authorization token
  setToken(token: string) {
    this.token = token;
  }

  // Generate unique ID (for local use until server generates one)
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get all threads from API
  async getAllThreads() {
    if (!this.docId) {
      console.error('Document ID not set. Call setDocumentId first.');
      return {};
    }

    try {
      const response = await ThreadService.getThreads(
        this.docId,
        this.token || undefined
      );
      const threads: Record<string, any> = {};

      // Convert array to object with ID as key for consistent interface
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((thread: any) => {
          threads[thread.id] = thread;
        });
      }

      // Update the cache but always return fresh data
      this.cachedThreads = threads;
      return threads;
    } catch (error) {
      console.error('Error fetching threads from API:', error);
      // Don't fall back to cached threads, return empty object instead
      return {};
    }
  }

  // Helper to update local cache
  updateThreadCache(threadId: string, thread: any) {
    if (!this.cachedThreads) {
      this.cachedThreads = {};
    }
    this.cachedThreads[threadId] = thread;
  }

  // Create a new thread
  async createThread(
    blockId: string,
    comment: string,
    position: { start: number; end: number }
  ) {
    if (!this.docId) {
      console.error('Document ID not set. Call setDocumentId first.');
      return null;
    }

    // Format according to CreateThreadDto
    const payload = {
      text: [{ text: comment }], // Text as array format
      type: 'comment', // Standard type for comment threads
      metadata: {
        blockId: blockId,
        markerPosition: {
          from: position.start || 0,
          to: position.end || comment.length,
        },
      },
    };

    try {
      const response = await ThreadService.createThread(
        this.docId,
        payload,
        this.token || undefined
      );
      const newThread = response.data;

      // Cache the thread locally
      this.updateThreadCache(newThread.id, newThread);

      return newThread;
    } catch (error) {
      console.error('Error creating thread via API:', error);
      return null;
    }
  }

  // Add comment to thread
  async addComment(threadId: string, content: string) {
    try {
      // Format according to AddCommentDto
      const data = {
        body: [{ text: content }],
      };

      const response = await ThreadService.addComment(
        threadId,
        data,
        this.token || undefined
      );

      // Update cache with new thread data
      await this.refreshThread(threadId);

      return response.data;
    } catch (error) {
      console.error('Error adding comment via API:', error);
      return null;
    }
  }

  // Helper to refresh a single thread from API
  async refreshThread(threadId: string) {
    return this.getThread(threadId);
  }

  // Edit comment
  async editComment(threadId: string, commentId: string, newContent: string) {
    try {
      // Format according to UpdateCommentDto
      const data = {
        body: [{ text: newContent }], // Body as array format per DTO
        metadata: {}, // Preserve any existing metadata
      };

      await ThreadService.updateComment(
        threadId,
        commentId,
        data,
        this.token || undefined
      );

      // Refresh the thread data in cache
      await this.refreshThread(threadId);
      return true;
    } catch (error) {
      console.error('Error editing comment via API:', error);
      return false;
    }
  }

  // Delete comment
  async deleteComment(threadId: string, commentId: string) {
    try {
      await ThreadService.deleteComment(
        threadId,
        commentId,
        this.token || undefined
      );

      // Try to fetch thread - if it doesn't exist anymore, that's okay
      try {
        // This will automatically update the cache if the thread exists
        await this.getThread(threadId);
      } catch (error) {
        // Thread may have been deleted if it was the last comment
        // Clean up local cache
        if (this.cachedThreads && this.cachedThreads[threadId]) {
          delete this.cachedThreads[threadId];
        }
      }

      return true;
    } catch (error) {
      console.error('Error deleting comment via API:', error);
      return false;
    }
  }

  // Resolve/unresolve thread
  async toggleThreadResolution(threadId: string) {
    try {
      // Get current thread data
      const thread = await this.getThread(threadId);

      if (!thread) return false;

      if (thread.resolved) {
        // If resolved, unresolve it
        await ThreadService.unresolveThread(threadId, this.token || undefined);
      } else {
        // If not resolved, resolve it
        await ThreadService.resolveThread(threadId, this.token || undefined);
      }

      // Refresh the thread in cache
      const updatedThread = await this.refreshThread(threadId);
      return updatedThread?.resolved;
    } catch (error) {
      console.error('Error toggling thread resolution via API:', error);
      return false;
    }
  }

  // Get thread by ID
  async getThread(threadId: string) {
    // Always fetch from API, never use cache
    try {
      const response = await ThreadService.getThread(
        threadId,
        this.token || undefined
      );
      const thread = response.data;

      // Still update the cache for other methods that might use it
      this.updateThreadCache(threadId, thread);
      return thread;
    } catch (error) {
      console.error(`Error fetching thread ${threadId} via API:`, error);
      return null;
    }
  }

  // Get threads for a specific block
  async getThreadsForBlock(blockId: string) {
    // Always fetch fresh data from API, then filter
    const threads = await this.getAllThreads();
    return Object.values(threads).filter(
      (thread: any) => thread.metadata && thread.metadata.blockId === blockId
    );
  }

  // Delete thread
  async deleteThread(threadId: string) {
    try {
      await ThreadService.deleteThread(threadId, this.token || undefined);

      // Remove from cache
      if (this.cachedThreads && this.cachedThreads[threadId]) {
        delete this.cachedThreads[threadId];
      }

      return true;
    } catch (error) {
      console.error('Error deleting thread via API:', error);
      return false;
    }
  }

  // Update thread position
  async updateThreadPosition(
    threadId: string,
    position: { start: number; end: number }
  ) {
    try {
      await ThreadService.updateThreadPosition(
        threadId,
        {
          position: {
            from: position.start || 0,
            to: position.end || 0,
          },
        },
        this.token || undefined
      );
      await this.refreshThread(threadId);
      return true;
    } catch (error) {
      console.error('Error updating thread position:', error);
      return false;
    }
  }

  // Add reaction to a comment
  async addReaction(threadId: string, commentId: string, emoji: string) {
    try {
      await ThreadService.addReaction(threadId, commentId, emoji);
      await this.refreshThread(threadId);
      return true;
    } catch (error) {
      console.error('Error adding reaction via API:', error);
      return false;
    }
  }

  // Remove reaction from a comment
  async removeReaction(threadId: string, commentId: string, emoji: string) {
    try {
      await ThreadService.deleteReaction(threadId, commentId, emoji);
      await this.refreshThread(threadId);
      return true;
    } catch (error) {
      console.error('Error removing reaction via API:', error);
      return false;
    }
  }

  // Save document (placeholder for future implementation)
  saveDocument(content: any) {
    // This would typically save the document content
    console.log('Saving document:', content);
  }

  // Load document (placeholder for future implementation)
  loadDocument() {
    // This would typically load the document content
    console.log('Loading document');
  }

  // Clear cache
  clearCache() {
    this.cachedThreads = {};
  }
}

// Export a singleton instance
export const commentSystem = new CommentSystem();
