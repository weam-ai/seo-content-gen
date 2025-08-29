import api from '@/lib/api';

export interface SystemPrompt {
  id: string;
  name: string;
  description: string;
  type: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_records: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

interface SystemPromptsResponse {
  status: boolean;
  message: string;
  data: SystemPrompt[];
  pagination?: PaginationMeta;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

class SystemPromptService {
  /**
   * Fetch system prompts with pagination
   */
  async getSystemPrompts(params?: PaginationParams): Promise<SystemPromptsResponse> {
    try {
      const response = await api.get<SystemPromptsResponse>('/system-prompts', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch all system prompts without pagination (for dropdowns, etc.)
   */
  async getAllSystemPrompts(): Promise<SystemPromptsResponse> {
    try {
      const response = await api.get<SystemPromptsResponse>('/system-prompts/list');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch a single system prompt by id
   */
  async getSystemPromptById(id: string): Promise<any> {
    try {
      const response = await api.get(`/system-prompts/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new system prompt
   */
  async createSystemPrompt(payload: { name: string; description: string }): Promise<any> {
    try {
      const response = await api.post('/system-prompts', payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing system prompt
   */
  async updateSystemPrompt(id: string, payload: { name?: string; description?: string }): Promise<any> {
    try {
      const response = await api.patch(`/system-prompts/${id}`, payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a system prompt
   */
  async deleteSystemPrompt(id: string): Promise<any> {
    try {
      const response = await api.delete(`/system-prompts/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch system prompts by type
   */
  async getSystemPromptsByType(type: string): Promise<SystemPromptsResponse> {
    try {
      const response = await api.get<SystemPromptsResponse>('/system-prompts/list', { params: { type } });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.message || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default new SystemPromptService(); 