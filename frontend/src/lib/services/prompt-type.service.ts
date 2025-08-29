import api from '@/lib/api';

export interface PromptType {
  id: string;
  name: string;
  titlePrompt: {
    id: string;
    name: string;
  };
  outlinePrompt: {
    id: string;
    name: string;
  };
  articlePrompt: {
    id: string;
    name: string;
  };
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

interface PromptTypesResponse {
  status: boolean;
  message: string;
  data: PromptType[];
  pagination?: PaginationMeta;
}

interface PromptTypeResponse {
  status: boolean;
  message: string;
  data: PromptType;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

class PromptTypeService {
  /**
   * Fetch prompt types with pagination
   */
  async getPromptTypes(params?: PaginationParams): Promise<PromptTypesResponse> {
    try {
      const response = await api.get<PromptTypesResponse>('/prompt-types', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch all prompt types without pagination (for dropdowns, etc.)
   */
  async getAllPromptTypes(): Promise<PromptTypesResponse> {
    try {
      const response = await api.get<PromptTypesResponse>('/prompt-types/list');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new prompt type
   */
  async createPromptType(data: {
    name: string;
    articlePrompt: string;
    outlinePrompt: string;
    titlePrompt: string;
  }): Promise<PromptTypeResponse> {
    try {
      const response = await api.post<PromptTypeResponse>('/prompt-types', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch a single prompt type by ID
   */
  async getPromptTypeById(id: string): Promise<PromptTypeResponse> {
    try {
      const response = await api.get<PromptTypeResponse>(`/prompt-types/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a prompt type
   */
  async updatePromptType(id: string, data: {
    name: string;
    titlePrompt: string;
    outlinePrompt: string;
    articlePrompt: string;
  }): Promise<PromptTypeResponse> {
    try {
      const response = await api.patch<PromptTypeResponse>(`/prompt-types/${id}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a prompt type
   */
  async deletePromptType(id: string): Promise<{ status: boolean; message: string }> {
    try {
      const response = await api.delete(`/prompt-types/${id}`);
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

export default new PromptTypeService();
