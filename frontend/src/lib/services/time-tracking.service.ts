import api from '../api';

export interface TimeTrackingStatus {
  status: 'running' | 'stopped';
  totalDuration: number; // in seconds
}

export interface TimeTrackingResponse {
  status: boolean;
  message: string;
  data?: TimeTrackingStatus;
}

export interface StartTimeTrackingPayload {
  articleId: string;
}

export interface StopTimeTrackingPayload {
  articleId: string;
}

export interface TimeLog {
  id: string;
  created_at: string;
  start_time: string;
  end_time: string;
  status: 'running' | 'stopped';
  note: string | null;
  article_id: string;
  user_id: string;
  username: string;
  profile_image: string | null;
  type: 'manual' | 'tracked';
}

export interface TimeLogsResponse {
  status: boolean;
  message: string;
  data: TimeLog[];
}

export interface ManualTimeLogPayload {
  articleId: string;
  startTime: string;
  endTime: string;
  note?: string;
}

export interface UpdateTimeLogPayload {
  startTime: string;
  endTime: string;
  note?: string;
}

export interface ApiResponse {
  status: boolean;
  message: string;
  data?: any;
}

export interface ManualTimeLogPayload {
  articleId: string;
  startTime: string;
  endTime: string;
  note?: string;
}

export interface UpdateTimeLogPayload {
  startTime: string;
  endTime: string;
  note?: string;
}

export interface ApiResponse {
  status: boolean;
  message: string;
  data?: any;
}

export interface ManualTimeLogPayload {
  articleId: string;
  startTime: string;
  endTime: string;
  note?: string;
}

export interface UpdateTimeLogPayload {
  startTime: string;
  endTime: string;
  note?: string;
}
// New interface for the all logs endpoint
export interface TimeTrackingLog {
  id: string;
  created_at: string;
  start_time: string;
  end_time: string;
  status: 'running' | 'stopped';
  note: string | null;
  type: 'tracked' | 'manual';
  article_id: string;
  article_name: string;
  project_id: string;
  project_name: string;
  user_id: string;
  username: string;
  profile_image: string | null;
  user_email: string;
}

export interface DeleteTimeLogResponse {
  status: boolean;
  message: string;
}

export interface TimeTrackingAllLogsResponse {
  status: boolean;
  message: string;
  pagination?: {
    total_records: number;
    current_page: number;
    total_pages: number;
  };
  data: TimeTrackingLog[];
  totalSeconds?: number;
}

/**
 * Start time tracking for an article
 */
export async function startTimeTracking(
  articleId: string
): Promise<TimeTrackingResponse> {
  try {
    const response = await api.post('/time-tracking/start', {
      articleId,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to start time tracking'
    );
  }
}

/**
 * Stop time tracking for an article
 */
export async function stopTimeTracking(
  articleId: string
): Promise<TimeTrackingResponse> {
  try {
    const response = await api.post('/time-tracking/stop', {
      articleId,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to stop time tracking'
    );
  }
}

/**
 * Get time tracking status for an article
 */
export async function getTimeTrackingStatus(
  articleId: string
): Promise<TimeTrackingStatus> {
  try {
    const response = await api.get(`/time-tracking/${articleId}/status`);

    if (!response.data.status) {
      throw new Error(
        response.data.message || 'Failed to fetch time tracking status'
      );
    }

    return response.data.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to fetch time tracking status'
    );
  }
}

/**
 * Get time logs for an article
 */
export async function getTimeLogs(articleId: string): Promise<TimeLog[]> {
  try {
    const response = await api.get(`/time-tracking/${articleId}/logs`);

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to fetch time logs');
    }

    return response.data.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to fetch time logs'
    );
  }
}

/**
 * Add manual time log for an article
 */
export async function addManualTimeLog(
  payload: ManualTimeLogPayload
): Promise<TimeTrackingResponse> {
  try {
    const response = await api.post('/time-tracking/manual', payload);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to add manual time log'
    );
  }
}

/**
 * Update a time log
 */
export async function updateTimeLog(
  timelogId: string,
  payload: UpdateTimeLogPayload
): Promise<TimeTrackingResponse> {
  try {
    const response = await api.patch(
      `/time-tracking/manual/${timelogId}`,
      payload
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to update time log'
    );
  }
}

/**
 * Delete a time log
 */
export async function deleteTimeLog(
  timelogId: string
): Promise<DeleteTimeLogResponse> {
  try {
    const response = await api.delete(`/time-tracking/manual/${timelogId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to delete time log'
    );
  }
}

/**
 * Get all time tracking logs (admin endpoint)
 */
export async function getAllTimeTrackingLogs(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  userId?: string;
  projectId?: string;
  type?: string;
  status?: string;
}): Promise<TimeTrackingAllLogsResponse> {
  try {
    const queryParams = new URLSearchParams();

    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] !== undefined && params[key as keyof typeof params] !== null) {
        queryParams.append(key, String(params[key as keyof typeof params]));
      }
    });

    const response = await api.get(`/time-tracking/logs/all?${queryParams}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to fetch all time tracking logs'
    );
  }
}

// Service class for backward compatibility
class TimeTrackingService {
  async getTimeTrackingLogs(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    userId?: string;
    projectId?: string;
    type?: string;
    status?: string;
  }): Promise<TimeTrackingAllLogsResponse> {
    return getAllTimeTrackingLogs(params);
  }

  async getTimeTrackingStats(): Promise<{ totalSeconds: number; users: any[] }> {
    try {
      const response = await api.get('/time-tracking/stats');
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch time tracking stats'
      );
    }
  }
}



export default new TimeTrackingService();
