import api from '@/lib/api';

// Types for designation API
export interface Designation {
  id: string;
  name: string;
  user_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface DesignationListResponse {
  status: boolean;
  message: string;
  data: Designation[];
  pagination?: {
    total_records: number;
    current_page: number;
    total_pages: number;
  };
}

export interface DesignationDetailResponse {
  status: boolean;
  message: string;
  data: Designation;
}

export interface CreateDesignationPayload {
  name: string;
}

export interface CreateDesignationResponse {
  status: boolean;
  message: string;
  data: Designation;
}

export interface UpdateDesignationPayload {
  name: string;
}

export interface UpdateDesignationResponse {
  status: boolean;
  message: string;
  data: Designation;
}

export interface DeleteDesignationResponse {
  status: boolean;
  message: string;
}

export interface GetDesignationsParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
}

class DesignationService {
  /**
   * Get list of designations
   */
  async getDesignations(
    params: GetDesignationsParams = {}
  ): Promise<DesignationListResponse> {
    try {
      const response = await api.get<DesignationListResponse>('/designations', {
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get designation by ID
   */
  async getDesignationById(
    designationId: string
  ): Promise<DesignationDetailResponse> {
    try {
      const response = await api.get<DesignationDetailResponse>(
        `/designations/${designationId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create new designation
   */
  async createDesignation(
    payload: CreateDesignationPayload
  ): Promise<CreateDesignationResponse> {
    try {
      const response = await api.post<CreateDesignationResponse>(
        '/designations',
        payload
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update designation
   */
  async updateDesignation(
    designationId: string,
    payload: UpdateDesignationPayload
  ): Promise<UpdateDesignationResponse> {
    try {
      const response = await api.patch<UpdateDesignationResponse>(
        `/designations/${designationId}`,
        payload
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete designation
   */
  async deleteDesignation(
    designationId: string
  ): Promise<DeleteDesignationResponse> {
    try {
      const response = await api.delete<DeleteDesignationResponse>(
        `/designations/${designationId}`
      );
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
      // Server responded with error status
      const message = error.response.data?.message || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default new DesignationService();
