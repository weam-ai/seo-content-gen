import type { Topic, Article } from '../types';
import api from '../api';
import { EditorSettings } from '@/modules/editor';

export interface GetTopicsParams {
  sort?: string;
  limit?: number;
  page?: number;
  search_by_status?: string;
  status?: string;
  search_by_agency?: string;
  staffid?: string;
  search_by_project?: string;
  search?: string;
}

export interface GetTopicsResponse<T> {
  status: boolean;
  message: string;
  pagination: {
    current_page: number;
    total_records: number;
    total_pages: number;
  };
  data: T[];
}

export interface ArticleTypeOption {
  _id: string;
  name: string;
}

export interface UpdateArticlePayload {
  name?: string;
  projectId?: string;
  // assigned_members removed for single-user application
  description?: string;
  keywords?: string;
  website_url?: string;
  published_url?: string;
  keyword_volume?: string | number;
  keyword_difficulty?: string;
  secondary_keywords?: string[];
  article_system_prompt?: string;
  outline_system_prompt?: string;
  title_system_prompt?: string;
  generated_outline?: string;
  prompt_type?: string;
  status?: string;
  author_bio?: string;
  meta_title?: string;
  meta_description?: string;
  settings?: EditorSettings;
}

export interface GetArticlesParams {
  limit?: number;
  page?: number;
  sort?: string;
  status?: string;
  search_by_status?: string;
  search_by_project?: string;
  task_type?: number;
  action_value?: number;
  search_by_agency?: string;
  staffid?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface ArticleAIContent {
  _id: string;
  created_at: string;
  open_ai_content: string;
  gemini_content: string;
  claude_content: string;
  selected_content: 'open_ai' | 'gemini' | 'claude';
  avg_word_count: number;
}

export interface ArticleEditorContent {
  created_at: string;
  updated_at: string;
  snapshot_data: string;
}



export interface CreateTopicPayload {
  name: string;
  projectId: string;
  keywords: string;
  secondary_keywords?: string[];
  generated_outline?: string;
}

export interface AddKeywordPayload {
  keyword: string;
  promptTypeId: string;
}

function mapApiTopicToTopic(apiTopic: any): Topic {
  // Always use the actual outline string, not a boolean or '1'
  const outline = apiTopic.generated_outline || apiTopic.outline || '';
  return {
    _id: apiTopic._id,
    title: apiTopic.name,
    relatedProject: {
      _id: apiTopic.project?._id || '',
      name: apiTopic.project?.name || '',
      description:
        apiTopic.project?.description || apiTopic.project?.description || '',
      // assignedTo field removed for single-user application
      language: apiTopic.project?.language || 'en-US',
      location: Array.isArray(apiTopic.project?.location)
        ? apiTopic.project.location.join(', ')
        : apiTopic.project?.location || '',
      websiteUrl:
        apiTopic.project?.website_url || apiTopic.project?.websiteUrl || '',
      competitorWebsites:
        apiTopic.project?.competitor_websites ||
        apiTopic.project?.competitorWebsites ||
        [],
      targetedKeywords:
        apiTopic.project?.targeted_keywords ||
        apiTopic.project?.targetedKeywords ||
        [],
      guideline: apiTopic.project?.guideline || '',
      projectSpecificGuidelines:
        apiTopic.project?.project_specific_guidelines ||
        apiTopic.project?.projectSpecificGuidelines ||
        '',
      businessSummary:
        apiTopic.project?.business_summary ||
        apiTopic.project?.businessSummary ||
        '',
      targetedAudience:
        apiTopic.project?.targeted_audience ||
        apiTopic.project?.targetedAudience ||
        '',
      businessDetails:
        apiTopic.project?.business_details ||
        apiTopic.project?.businessDetails ||
        '',
      createdAt: new Date(apiTopic.project?.created_at || apiTopic.created_at),
      updatedAt: new Date(apiTopic.project?.updated_at || apiTopic.updated_at),
      status: apiTopic.project?.status || 'active',
      aiRecommendedKeywords:
        apiTopic.project?.ai_recommended_keywords ||
        apiTopic.project?.aiRecommendedKeywords ||
        [],
      agency: apiTopic.project?.agency,
    },
    keyword: apiTopic.keywords || '',
    secondaryKeywords: apiTopic.secondary_keywords || [],
    volume: apiTopic.keyword_volume || 0,
    keywordDifficulty: (apiTopic.keyword_difficulty || 'low').toLowerCase(),
    status:
      apiTopic.status === 'pending'
        ? 'pending approval'
        : apiTopic.status === 'not_started' ||
          apiTopic.status === 'approved' ||
          apiTopic.status === 'mark as approved'
        ? 'approved'
        : apiTopic.status === 'rejected' ||
          apiTopic.status === 'mark as rejected'
        ? 'rejected'
        : apiTopic.status,
    // assignedTo and followers fields removed for single-user application
    // createdBy field removed for single-user application
    createdAt: new Date(apiTopic.created_at),
    startDate: apiTopic.start_date ? new Date(apiTopic.start_date) : undefined,
    dueDate: apiTopic.end_date ? new Date(apiTopic.end_date) : undefined,
    updatedAt: new Date(apiTopic.updated_at),
    outline,
    generated_outline: apiTopic.generated_outline || '', // Add this line to map the API field
    is_outline_generated: apiTopic.is_outline_generated,
    articleType: apiTopic.prompt_type?.name?.trim() || 'blog post',
    avgWordCount: apiTopic.wordCount || apiTopic.avgWordCount || 0,
    topicId: apiTopic.topicId || '',
  };
}

function mapApiArticleToArticle(apiArticle: any): Article {
  return {
    _id: apiArticle._id,
    title: apiArticle.name,
    relatedProject: {
      _id: apiArticle.project?._id || '',
      name: apiArticle.project?.name || '',
      description:
        apiArticle.project?.description ||
        apiArticle.project?.description ||
        '',
      // assignedTo field removed for single-user application
      language: apiArticle.project?.language || 'en-US',
      location: Array.isArray(apiArticle.project?.location)
        ? apiArticle.project.location.join(', ')
        : apiArticle.project?.location || '',
      websiteUrl:
        apiArticle.project?.website_url || apiArticle.project?.websiteUrl || '',
      competitorWebsites:
        apiArticle.project?.competitor_websites ||
        apiArticle.project?.competitorWebsites ||
        [],
      targetedKeywords:
        apiArticle.project?.targeted_keywords ||
        apiArticle.project?.targetedKeywords ||
        [],
      guideline: apiArticle.project?.guideline || '',
      projectSpecificGuidelines:
        apiArticle.project?.project_specific_guidelines ||
        apiArticle.project?.projectSpecificGuidelines ||
        '',
      businessSummary:
        apiArticle.project?.business_summary ||
        apiArticle.project?.businessSummary ||
        '',
      targetedAudience:
        apiArticle.project?.targeted_audience ||
        apiArticle.project?.targetedAudience ||
        '',
      businessDetails:
        apiArticle.project?.business_details ||
        apiArticle.project?.businessDetails ||
        '',
      createdAt: new Date(
        apiArticle.project?.created_at || apiArticle.created_at
      ),
      updatedAt: new Date(
        apiArticle.project?.updated_at || apiArticle.updated_at
      ),
      status: apiArticle.project?.status || 'active',
      aiRecommendedKeywords:
        apiArticle.project?.ai_recommended_keywords ||
        apiArticle.project?.aiRecommendedKeywords ||
        [],
      agency: apiArticle.project?.agency,
    },
    keyword: apiArticle.keywords || '',
    secondaryKeywords: apiArticle.secondary_keywords || [],
    volume: apiArticle.keyword_volume || 0,
    keywordDifficulty: (apiArticle.keyword_difficulty || 'low').toLowerCase(),
    status: (apiArticle.status || 'not started').replace(/_/g, ' '),
    // assignedTo and followers fields removed for single-user application
    // createdBy field removed for single-user application
    createdAt: new Date(apiArticle.created_at),
    startDate: apiArticle.start_date
      ? new Date(apiArticle.start_date)
      : undefined,
    dueDate: apiArticle.end_date ? new Date(apiArticle.end_date) : undefined,
    updatedAt: new Date(apiArticle.updated_at),
    outline: apiArticle.generated_outline || apiArticle.outline || '',
    generated_outline: apiArticle.generated_outline || '',
    articleType: apiArticle.prompt_type?.name?.trim() || 'blog post',
    avgWordCount:
      apiArticle.avg_word_count ||
      apiArticle.avgWordCount ||
      apiArticle.wordCount ||
      0,
    topicId: apiArticle.topicId || '',
    author_bio: apiArticle.author_bio,
    meta_title: apiArticle.meta_title,
    meta_description: apiArticle.meta_description,
    settings: apiArticle.settings || undefined,
  };
}

export async function getTopics(
  params: GetTopicsParams
): Promise<GetTopicsResponse<Topic>> {
  const response = await api.get('/article', { params });
  const json = response.data;
  return {
    ...json,
    data: Array.isArray(json.data) ? json.data.map(mapApiTopicToTopic) : [],
  };
}

export async function getTopicDetail(id: string): Promise<Topic> {
  const response = await api.get(`/article/${id}`);
  const json = response.data;
  if (!json.status || !json.data) {
    throw new Error(json.message || 'Failed to fetch topic details');
  }
  return mapApiTopicToTopic(json.data);
}

export async function generateOutline(id: string): Promise<string> {
  const response = await api.get(`/article/${id}/outline`, {
    params: { refresh: true },
  });
  const json = response.data;
  if (!json.status || !json.data) {
    throw new Error(json.message || 'Failed to generate outline');
  }
  return json.data;
}

export async function getArticleTypes(): Promise<ArticleTypeOption[]> {
  const PromptTypeService = (await import('./prompt-type.service')).default;
  const response = await PromptTypeService.getAllPromptTypes();
  if (!response.status || !response.data) {
    throw new Error(response.message || 'Failed to fetch article types');
  }
  // Use _id directly for frontend
  return response.data.map((item: any) => ({
    _id: item._id,
    name: item.name
  }));
}

export async function updateArticle(
  id: string,
  payload: UpdateArticlePayload
): Promise<any> {
  const response = await api.patch(`/article/${id}`, payload);
  return response.data;
}

export async function deleteArticle(id: string): Promise<any> {
  const response = await api.delete(`/article/${id}`);
  return response.data;
}

export async function getArticles<T>(
  params: GetArticlesParams
): Promise<GetTopicsResponse<T>> {
  const response = await api.get('/article', { params });
  const json = response.data;
  return {
    ...json,
    data: Array.isArray(json.data) ? json.data.map(mapApiArticleToArticle) : [],
  };
}

export async function getArticleDetail(id: string): Promise<Article> {
  const response = await api.get(`/article/${id}`);
  const json = response.data;
  if (!json.status || !json.data) {
    throw new Error(json.message || 'Failed to fetch article details');
  }
  return mapApiArticleToArticle(json.data);
}

export const getArticleAIContent = async (
  articleId: string
): Promise<ArticleAIContent> => {
  try {
    const response = await api.get(`/article/${articleId}/ai-content`);

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to fetch AI content');
    }

    // Handle both direct data and nested doc structure
    const contentData = response.data.data.doc || response.data.data;
    
    return {
      _id: contentData._id,
      created_at: contentData.created_at,
      open_ai_content: contentData.open_ai_content || '',
      gemini_content: contentData.gemini_content || '',
      claude_content: contentData.claude_content || '',
      selected_content: contentData.selected_content ?? null,
      avg_word_count: contentData.avg_word_count || 0,
    };
  } catch (error: any) {
    console.error('API Error:', error); // Debug log
    throw error;
  }
};

export const getArticleEditorContent = async (
  articleId: string
): Promise<ArticleEditorContent> => {
  try {
    const response = await api.get(`/article-documents/${articleId}/content`);

    if (!response.data.status) {
      throw new Error(
        response.data.message || 'Failed to fetch editor content'
      );
    }

    return response.data.data;
  } catch (error: any) {
    console.error('API Error:', error); // Debug log
    throw error;
  }
};

interface UpdateEditorContentPayload {
  session_id: string;
  snapshot: string;
}

export const updateArticleEditorContent = async (
  articleId: string,
  payload: UpdateEditorContentPayload
): Promise<void> => {
  try {
    const response = await api.post(
      `/article-documents/${articleId}/update`,
      payload
    );

    if (!response.data.status) {
      throw new Error(
        response.data.message || 'Failed to update editor content'
      );
    }
  } catch (error: any) {
    console.error('API Error:', error); // Debug log
    throw error;
  }
};





// Generate LLM content for an article (OpenAI, Gemini, Claude)
export async function generateArticleAIContent(
  articleId: string,
  model: 'open_ai' | 'gemini' | 'claude',
) {
  const response = await api.post(`/article/${articleId}/ai-content`, {
    model,
  });
  return response.data;
}

// Regenerate topic title
export async function regenerateTopicTitle(topicId: string): Promise<string> {
  try {
    // Call the correct backend endpoint with article ID (topicId)
    const response = await api.get(`/article/${topicId}/topics`);
    if (!response.data?.data) {
      throw new Error('Failed to regenerate topic title');
    }
    return response.data?.data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to regenerate topic title');
  }
}

// Create a new topic
export async function createTopic(
  payload: CreateTopicPayload
): Promise<{ status: boolean; message: string; data: any }> {
  try {
    const response = await api.post('/article', payload);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || 'Failed to create topic'
    );
  }
}

export async function addKeywordsToProject(
  projectId: string,
  keywords: AddKeywordPayload[],
  secondary_keywords: string[] = []
) {
  try {
    const payload: any = { keywords };
    if (secondary_keywords.length > 0) {
      payload.secondary_keywords = secondary_keywords;
    }
    const response = await api.post(
      `/projects/${projectId}/add-keywords`,
      payload
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || 'Failed to add keywords'
    );
  }
}

// Select AI content for an article
export async function selectArticleAIContent(
  articleId: string,
  selected_content: 'open_ai' | 'gemini' | 'claude',
  session_id?: string
): Promise<any> {
  const response = await api.post(`/article/${articleId}/select-ai-content`, {
    selected_content,
    session_id,
  });
  return response.data;
}

// Calendar view API response type
export interface CalendarArticlesResponse {
  status: boolean;
  message: string;
  data: {
    [status: string]: any[]; // e.g. pending, rejected, etc.
  };
}

export interface GetArticlesCalendarParams {
  module: 'topics' | 'articles';
  sort: string;
  status: string;
  start_date: string;
  end_date: string;
}

// Fetch articles for calendar view
export async function getArticlesCalendarView(
  params: Record<string, any>
): Promise<CalendarArticlesResponse> {
  const response = await api.get('/article/status-view', { params });
  return response.data;
}

export async function implementArticle(
  articleId: string,
  auditReport: string,
  editorContent: string
): Promise<string> {
  try {
    const response = await api.post(`/article/${articleId}/implement`, {
      auditReport,
      editorContent,
    });
    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to implement article');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('API Error:', error);
    throw error;
  }
}

export async function getRecommendedKeywords(
  articleId: string
): Promise<any[]> {
  const res = await api.get(`/article/${articleId}/recommended-keywords`);
  if (res.data.status && Array.isArray(res.data.data)) {
    return res.data.data;
  }
  return [];
}

// Interface for recommended keyword response
export interface RecommendedKeywordData {
  keyword: string;
  search_volume: number;
  competition: string;
  competition_index: number;
  cpc: number;
}

export interface RecommendedKeywordsResponse {
  status: boolean;
  message: string;
  data: RecommendedKeywordData[];
}

// Fetch recommended keywords by primary keyword
export async function fetchRecommendedKeywordsByKeyword(
  keyword: string
): Promise<RecommendedKeywordData[]> {
  try {
    const response = await api.post('/projects/recommended-keywords', {
      keyword,
    });

    if (!response.data.status) {
      throw new Error(
        response.data.message || 'Failed to fetch recommended keywords'
      );
    }

    return response.data.data || [];
  } catch (error: any) {
    console.error('API Error:', error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Failed to fetch recommended keywords'
    );
  }
}
