import api from '../api';

export interface ProjectActivityLog {
  id: string;
  created_at: string;
  user?: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    profile_image?: string;
  } | null;
  eventType: string;
  payload: string;
}

export interface ProjectActivityListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  startDate?: string;
  endDate?: string;
}

export interface ProjectActivityListResponse {
  data: ProjectActivityLog[];
  pagination: {
    current_page: number;
    total_records: number;
    total_pages: number;
  };
}

// Allowed event types for project activity
export const ALLOWED_EVENT_TYPES = [
  'project.created',
  'project.updated',
  'project.deleted',
  'topic.created',
  'topic.updated',
  'topic.deleted',
  'article.created',
  'article.updated',
  'article.deleted',
];

// Helper: Extract Project Name from Payload String
export function extractProjectName(payload: string): string {
  if (!payload) return '';
  const inProjectMatch = payload.match(/in Project \[.*?name:\s*([^\],]+)/i);
  if (inProjectMatch && inProjectMatch[1]) {
    return inProjectMatch[1].trim();
  }
  const fromProjectMatch = payload.match(/from Project \[.*?name:\s*([^\],]+)/i);
  if (fromProjectMatch && fromProjectMatch[1]) {
    return fromProjectMatch[1].trim();
  }
  const firstNameMatch = payload.match(/\[[^\]]*?name:\s*([^\],]+)/i);
  if (firstNameMatch && firstNameMatch[1]) {
    return firstNameMatch[1].trim();
  }
  return '';
}

// Helper: Extract Project ID from Payload String
export function extractProjectId(payload: string): string | null {
  if (!payload) return null;
  const projectPattern = /(?:Project|in Project|from Project)\s*\[id:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
  const projectMatch = payload.match(projectPattern);
  return projectMatch ? projectMatch[1] : null;
}

// Helper: Extract event action/description
export function extractDescription(payload: string): string {
  if (!payload) return '';
  const match = payload.match(/^(Topic|Project|Article) (Created|Updated|Deleted)/i);
  return match ? `${match[1]} ${match[2]}` : payload.split('[')[0].trim();
}

class ProjectActivityService {
  async getProjectActivityLogs(params: ProjectActivityListParams): Promise<ProjectActivityListResponse> {
    try {
      const response = await api.get('/activity-events', { params });
      if (Array.isArray(response.data?.data)) {
        // Filter for allowed event types
        const filtered = response.data.data.filter(
          (item: ProjectActivityLog) => ALLOWED_EVENT_TYPES.includes((item.eventType || '').toLowerCase())
        );
        return {
          data: filtered,
          pagination: response.data.pagination || {
            current_page: 1,
            total_records: filtered.length,
            total_pages: 1,
          },
        };
      } else {
        throw new Error('Invalid response from server: data is not an array');
      }
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch project activity logs');
      } else if (error.request) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error(error.message || 'An unexpected error occurred');
      }
    }
  }
}

export default new ProjectActivityService(); 