import api from '../api';

export interface ActivityLog {
  id: string;
  eventType: string;
  payload: string;
  created_at: string;
  user?: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    profile_image?: string;
  } | null;
}

export interface ActivityLogListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  startDate?: string;
  endDate?: string;
}

export interface ActivityLogListResponse {
  data: ActivityLog[];
  pagination: {
    current_page: number;
    total_records: number;
    total_pages: number;
  };
}

class ActivityLogService {
  async getActivityLogs(params: ActivityLogListParams): Promise<ActivityLogListResponse> {
    try {
      const response = await api.get('/activity-events', { params });
      // Always extract pagination and data from the root of the response
      if (Array.isArray(response.data?.data)) {
        return {
          data: response.data.data,
          pagination: response.data.pagination || {
            current_page: 1,
            total_records: response.data.data.length,
            total_pages: 1,
          },
        };
      } else {
        throw new Error('Invalid response from server: data is not an array');
      }
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch activity logs');
      } else if (error.request) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error(error.message || 'An unexpected error occurred');
      }
    }
  }
}

export default new ActivityLogService(); 