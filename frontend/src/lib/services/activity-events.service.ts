import api from '../api';

export interface ActivityEvent {
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

export interface GetActivityEventsParams {
  page?: number;
  limit?: number;
  search?: string;
  eventType?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  startDate?: string;
  endDate?: string;
  module?: string;
}

export interface ActivityEventsPagination {
  current_page: number;
  total_records: number;
  total_pages: number;
}

export interface GetActivityEventsResponse {
  activityEvents: ActivityEvent[];
  pagination: ActivityEventsPagination;
}

const activityEventsService = {
  async getActivityEvents(params: GetActivityEventsParams = {}): Promise<GetActivityEventsResponse> {
    const response = await api.get('/activity-events', { params });
    return {
      activityEvents: response.data.activityEvents || [],
      pagination: response.data.pagination || {
        current_page: 1,
        total_records: 0,
        total_pages: 1,
      },
    };
  },
};

export default activityEventsService; 