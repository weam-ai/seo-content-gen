/// <reference types="vite/types/importMeta.d.ts" />
import axios from 'axios';
import api from '../api';

class APIService {
  private static baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

  // Y-Sweet authentication endpoint for real-time collaboration
  static async yDocAuthEndpoint({ docId }: { docId: string }) {
    return axios.post(`${this.baseURL}/documents/${docId}/auth`, {
      docId,
    });
  }

  // Article content management
  static async updateArticleContent(
    docId: string,
    data: { snapshot: string; session_id: string }
  ) {
    // Use the environment baseURL for updating article documents
    return api.post(`/article-documents/${docId}/update`, data);
  }

  static async getArticleContent(docId: string) {
    return axios.get(`${this.baseURL}/articles/${docId}/content`);
  }

  // AI content management
  static async getAIContentForArticle(taskId: string) {
    return axios.get(`${this.baseURL}/articles/${taskId}/ai-content`);
  }

  static async regenerateArticlePart(data: {
    article: string;
    text: string;
    prompt: string;
  }) {
    return api.post('/openai/regenerate-article-part', data);
  }

  // Chat functionality removed

  // Document session management
  static async createDocumentSession(docId: string, userId: string) {
    return axios.post(`${this.baseURL}/documents/${docId}/sessions`, {
      userId,
      docId,
    });
  }

  static async getDocumentSession(docId: string, sessionId: string) {
    return axios.get(
      `${this.baseURL}/documents/${docId}/sessions/${sessionId}`
    );
  }

  // Removed assignOrUnassignArticleMember method for single-user application

  // Article creation and management methods
  static async checkExistTitle(projectId: string, params: { title: string }) {
    return api.post(`/article/${projectId}/check-title`, params);
  }

  static async getProjectForEdit(projectId: string) {
    return api.get(`/projects/${projectId}`);
  }

  static async addTask(params: any) {
    return api.post('/article', params);
  }

  static async getArticleOutline(articleId: string, refresh: boolean = false) {
    const queryString = refresh ? '?refresh=true' : '';
    return api.get(`/article/${articleId}/outline${queryString}`);
  }

  // Notifications API removed for single-user application


  // Chat history functionality removed
}

export default APIService;
