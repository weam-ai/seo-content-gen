import { EditorSettings } from '@/modules/editor';

export interface User {
  _id: string;
  email: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  language: 'en-US' | 'en-UK' | 'en-AU';
  location: string;
  websiteUrl: string;
  competitorWebsites: string[];
  targetedKeywords: string[];
  guideline: string;
  projectSpecificGuidelines: string;
  businessSummary: string;
  targetedAudience: string;
  businessDetails: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'completed' | 'archived';
  aiRecommendedKeywords?: string[];
  agency?: 'internal' | 'external' | 'freelance';
}

export interface ProjectFormData {
  name: string;
  language: 'en-US' | 'en-UK' | 'en-AU';
  location: string;
  websiteUrl: string;
  competitorWebsites: string[];
  targetedKeywords: string[];
  guideline: string;
  projectSpecificGuidelines: string;
  businessSummary: string;
  targetedAudience: string;
  businessDetails: string;
}

export type TopicStatus = 'pending approval' | 'rejected';
export type ArticleStatus =
  | 'not started'
  | 'in progress'
  | 'internal review'
  | 'awaiting feedback'
  | 'published'
  | 'pending'
  | 'rejected'
  | 'approved'
  | 'mark as approved'
  | 'mark as rejected'
  | 'not_started'
  | 'in_progress'
  | 'internal_review'
  | 'awaiting_feedback';
export type ArticleType =
  | 'blog post'
  | 'landing page'
  | 'product description'
  | 'case study'
  | 'white paper'
  | 'social media'
  | 'email campaign'
  | 'press release';

export interface Topic {
  _id: string;
  title: string;
  relatedProject: Project;
  keyword: string;
  secondaryKeywords: string[];
  volume: number;
  keywordDifficulty: 'low' | 'medium' | 'high';
  status: TopicStatus;
  // createdBy field removed for single-user application
  createdAt: Date;
  startDate?: Date;
  dueDate?: Date;
  updatedAt: Date;
  outline?: string;
  generated_outline?: string; // Add this field to match API response
  articleType: ArticleType;
  avgWordCount?: number;
  topicId?: string;
  is_outline_generated?: boolean;
}

export interface Article {
  _id: string;
  title: string;
  relatedProject: Project;
  keyword: string;
  secondaryKeywords: string[];
  volume: number;
  keywordDifficulty: 'low' | 'medium' | 'high';
  status: ArticleStatus;
  // createdBy field removed for single-user application
  createdAt: Date;
  startDate?: Date;
  dueDate?: Date;
  updatedAt: Date;
  approved_at?: Date | null;
  content?: string;
  avgWordCount?: number;
  topicId: string; // Reference to the original topic
  articleType: ArticleType;
  aiContent?: {
    openai?: string;
    gemini?: string;
    claude?: string;
  };
  outline?: string;
  generated_outline?: string;
  author_bio?: string;
  meta_title?: string;
  meta_description?: string;
  settings?: Omit<EditorSettings, 'theme'>;
}
