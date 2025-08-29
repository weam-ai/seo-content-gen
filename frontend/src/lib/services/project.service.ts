import api from '@/lib/api';

interface AssignMember {
  id: string;
  name: string;
  profile_image: string | null;
  is_agency_owner: boolean;
  agency_name: string | null;
}

export interface Project {
  id: string;
  name: string;
  website_url: string;
  created_at: string;
  description: string;
  keywords: string[];
  assign_member: AssignMember[];
  agency_name: string | null;
}

interface Pagination {
  total_records: number;
  current_page: number;
  total_pages: number;
}

interface ProjectsResponse {
  status: boolean;
  message: string;
  pagination: Pagination;
  data: Project[];
}

export interface Keyword {
  article_id: string;
  prompt_type_id: string;
  volume: number;
  keyword: string;
  difficulty: string;
  is_title_generated?: boolean;
  title: string | null;
}

// Role interface removed for single-user application

export interface AssignedToMember {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  profile_image: string | null;
  // role property removed for single-user application
  agency_name: string | null;
}

export interface ProjectDetail
  extends Omit<Project, 'keywords' | 'assign_member'> {
  competitors_websites: string[];
  targeted_keywords: string[];
  recommended_keywords: string[] | null;
  topic_titles: string[] | null;
  language: string;
  location: string[];
  targeted_audience: string;
  sitemapdata: string;
  detailedsitemap: string;
  keywords: Keyword[];
  assign_to: AssignedToMember[];
  guideline: any;
  guideline_description: string;
  progress: number;
  author_bio: string;
  organization_archetype: string;
  brand_spokesperson: string;
  most_important_thing: string;
  unique_differentiator: string;
}

interface ProjectDetailResponse {
  status: boolean;
  message: string;
  data: ProjectDetail;
}

export interface RecommendedKeyword {
  keyword: string;
  search_volume: number;
  competition: string;
  competition_index: number;
  title: string | null;
  cpc: number;
}

interface FetchKeywordRecommendationResponse {
  status: boolean;
  message: string;
  data: RecommendedKeyword[];
}

export interface CreateProjectPayload {
  name: string;
  description: string;
  competitors_websites: string[];
  targeted_keywords: {
    keyword: string;
    promptTypeId: string;
  }[];
  website_url: string;
  topic_titles: string;
  language: string;
  location: string[];
  targeted_audience: string;
  sitemapdata: string;
  detailedsitemap: string;
  // assign_to: string[]; // Removed for single-user application
  guideline_id: string;
  guideline_description: string;
}

export interface GenerateBusinessSummaryPayload {
  website_url: string;
}

export interface GenerateBusinessSummaryResponse {
  status: boolean;
  message: string;
  data: {
    company_name: string;
    company_details: string;
    target_audience: string[];
    owner_bio: string;
  };
}

export interface GetProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  user_id?: string;
}

class ProjectService {
  /**
   * Fetch projects with pagination and filters
   */
  async getProjects(params: GetProjectsParams): Promise<ProjectsResponse> {
    try {
      const response = await api.get<ProjectsResponse>('/projects', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch a single project by its ID
   */
  async getProjectById(projectId: string): Promise<ProjectDetailResponse> {
    try {
      const response = await api.get<ProjectDetailResponse>(
        `/projects/${projectId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch keyword recommendations for a project
   */
  async fetchKeywordRecommendation(
    projectId: string
  ): Promise<FetchKeywordRecommendationResponse> {
    try {
      const response = await api.get<FetchKeywordRecommendationResponse>(
        `/projects/${projectId}/fetch-keyword-recommendation`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new project
   */
  async createProject(
    payload: CreateProjectPayload
  ): Promise<ProjectDetailResponse> {
    try {
      const response = await api.post<ProjectDetailResponse>(
        '/projects',
        payload
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate business summary from website URL
   */
  async generateBusinessSummary(
    payload: GenerateBusinessSummaryPayload
  ): Promise<GenerateBusinessSummaryResponse> {
    try {
      const response = await api.post<GenerateBusinessSummaryResponse>(
        '/projects/business-summary',
        payload
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a project by its ID
   */
  async updateProject(
    projectId: string,
    payload: any
  ): Promise<ProjectDetailResponse> {
    try {
      const response = await api.patch<ProjectDetailResponse>(
        `/projects/${projectId}`,
        payload
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Project member assignment methods removed for single-user application

  /**
   * Fetch keywords for a project
   */
  async getProjectKeywords(
    projectId: string
  ): Promise<{ status: boolean; message: string; data: Keyword[] }> {
    try {
      const response = await api.get<{
        status: boolean;
        message: string;
        data: Keyword[];
      }>(`/article/project/${projectId}/keywords`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Add new keywords to a project
   */
  async addProjectKeywords(
    projectId: string,
    keywords: { keyword: string; promptTypeId: string }[]
  ): Promise<{ status: boolean; message: string; data: Keyword[] }> {
    try {
      const response = await api.post<{
        status: boolean;
        message: string;
        data: Keyword[];
      }>(`/projects/${projectId}/add-keywords`, { keywords });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Project members fetching method removed for single-user application

  /**
   * Fetch sitemap data for a project
   */
  async getProjectSitemap(
    projectId: string,
    refresh: boolean = false
  ): Promise<{
    status: boolean;
    message: string;
    data: {
      overview: {
        site_urls: string;
        total_pages: number;
        contain_types: Array<{
          type: string;
          count: number;
        }>;
      };
      detailed: Array<{
        url: string;
        pageType: string;
        metaTitle: string;
        metaDescription: string;
      }>;
    };
  }> {
    try {
      const response = await api.get<{
        status: boolean;
        message: string;
        data: {
          overview: {
            site_urls: string;
            total_pages: number;
            contain_types: Array<{
              type: string;
              count: number;
            }>;
          };
          detailed: Array<{
            url: string;
            pageType: string;
            metaTitle: string;
            metaDescription: string;
          }>;
        };
      }>(`/projects/${projectId}/sitemap?refresh=` + refresh);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a project keyword
   */
  async updateProjectKeyword(
    articleId: string,
    payload: { prompt_type: string; keywords: string }
  ): Promise<{ status: boolean; message: string }> {
    try {
      const response = await api.patch<{ status: boolean; message: string }>(
        `/article/${articleId}`,
        payload
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteProject(
    projectId: string
  ): Promise<{ status: boolean; message: string }> {
    try {
      const response = await api.delete<{ status: boolean; message: string }>(
        `/projects/${projectId}`
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
      const message = error.response.data?.message || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default new ProjectService();
