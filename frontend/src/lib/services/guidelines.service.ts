import api from '../api';

export interface Guideline {
  id: string;
  _id?: string;
  name: string;
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GuidelinesResponse {
  status: boolean;
  message: string;
  data: Guideline[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GuidelinesListResponse {
  status: boolean;
  message: string;
  data: Guideline[];
}

class GuidelinesService {
  /**
   * Get all guidelines with pagination
   */
  static async getGuidelines(page = 1, limit = 50): Promise<GuidelinesResponse> {
    try {
      const response = await api.get<GuidelinesResponse>('/guidelines', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching guidelines:', error);
      throw error;
    }
  }

  /**
   * Get simplified guidelines list (for dropdowns)
   */
  static async getGuidelinesList(): Promise<GuidelinesListResponse> {
    try {
      const response = await api.get<GuidelinesListResponse>('/guidelines/list');
      return response.data;
    } catch (error) {
      console.error('Error fetching guidelines list:', error);
      throw error;
    }
  }

  /**
   * Get guideline by ID
   */
  static async getGuidelineById(id: string): Promise<{ status: boolean; message: string; data: Guideline }> {
    try {
      const response = await api.get<{ status: boolean; message: string; data: Guideline }>(`/guidelines/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching guideline:', error);
      throw error;
    }
  }

  /**
   * Create new guideline
   */
  static async createGuideline(guideline: Partial<Guideline>): Promise<{ status: boolean; message: string; data: Guideline }> {
    try {
      const response = await api.post<{ status: boolean; message: string; data: Guideline }>('/guidelines', guideline);
      return response.data;
    } catch (error) {
      console.error('Error creating guideline:', error);
      throw error;
    }
  }

  /**
   * Update guideline
   */
  static async updateGuideline(id: string, guideline: Partial<Guideline>): Promise<{ status: boolean; message: string; data: Guideline }> {
    try {
      const response = await api.patch<{ status: boolean; message: string; data: Guideline }>(`/guidelines/${id}`, guideline);
      return response.data;
    } catch (error) {
      console.error('Error updating guideline:', error);
      throw error;
    }
  }

  /**
   * Delete guideline
   */
  static async deleteGuideline(id: string): Promise<{ status: boolean; message: string }> {
    try {
      const response = await api.delete<{ status: boolean; message: string }>(`/guidelines/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting guideline:', error);
      throw error;
    }
  }
}

export default GuidelinesService;