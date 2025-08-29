import api from '@/lib/api';

export interface Guideline {
  id: string;
  name: string;
  description: string;
  project_count: number;
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

interface GuidelinesResponse {
  status: boolean;
  message: string;
  data: Guideline[];
  pagination?: PaginationMeta;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

class GuidelineService {
  /**
   * Fetch guidelines with pagination
   */
  async getGuidelines(params?: PaginationParams): Promise<GuidelinesResponse> {
    try {
      const response = await api.get<GuidelinesResponse>('/guidelines', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch all guidelines without pagination (for dropdowns, etc.)
   */
  async getAllGuidelines(): Promise<GuidelinesResponse> {
    try {
      const response = await api.get<GuidelinesResponse>('/guidelines/list');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new guideline
   */
  async createGuideline(payload: { name: string; description: string }): Promise<any> {
    try {
      const response = await api.post('/guidelines', payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing guideline
   */
  async updateGuideline(id: string, payload: { name?: string; description?: string }): Promise<any> {
    try {
      const response = await api.patch(`/guidelines/${id}`, payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a guideline
   */
  async deleteGuideline(id: string): Promise<any> {
    try {
      const response = await api.delete(`/guidelines/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch a single guideline by id
   */
  async getGuidelineById(id: string): Promise<any> {
    try {
      const response = await api.get(`/guidelines/${id}`);
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

export default new GuidelineService();
