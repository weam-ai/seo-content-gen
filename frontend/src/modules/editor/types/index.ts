export interface ArticleDetails {
  id: string;
  title: string;
  status: string;
  wordCount: number;
  lastModified: Date;
  author: string;
  tags: string[];
}

// Removed chat functionality - ChatMessage interface deleted
// export interface ChatMessage {
//   id: string;
//   content: string;
//   sender: 'user' | 'ai';
//   timestamp: Date;
// }

export interface ChecklistItem {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  score?: number;
  suggestions?: string[];
}

export interface TimeLogEntry {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  activity: string;
}

export interface EditorSettings {
  theme: 'light' | 'dark';
  focusMode: boolean;
  typography: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    blockSpacing: number;
  };
  ai: {
    model: string;
    temperature: number;
    documentLanguage: string;
    tone: string;
  };
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  // role property removed for single-user application
}

export interface EEATScore {
  category:
    | 'experience'
    | 'expertise'
    | 'authoritativeness'
    | 'trustworthiness';
  score: number;
  maxScore: number;
  feedback: string[];
  suggestions: string[];
}

export interface EEATReport {
  id: string;
  overallScore: number;
  maxOverallScore: number;
  scores: EEATScore[];
  generatedAt: Date;
  status: 'analyzing' | 'completed' | 'failed';
}

export interface Thread {
  id: string;
  documentId?: string;
  metadata?: {
    blockId: string;
    markerPosition: {
      from: number;
      to: number;
    };
  };
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedBy?: any;
  comments: Comment[];
}

export interface Comment {
  id: string;
  body: Array<{ text: string }>;
  metadata?: {
    blockId: string;
    markerPosition: {
      from: number;
      to: number;
    };
  };
  author: {
    id: string;
    firstname: string;
    lastname: string;
    profile_image?: string;
    created_at?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  reactions?: any[];
}

export interface LegacyReply {
  id: string;
  text: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: Date;
}

// Legacy interface for backward compatibility
export interface LegacyComment {
  id: string;
  text: string;
  selectedText: string;
  blockId: string;
  position: {
    start: number;
    end: number;
  };
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: Date;
  resolved: boolean;
  replies?: LegacyReply[];
}

export interface CommentSelection {
  blockId: string;
  selectedText: string;
  position: {
    start: number;
    end: number;
  };
  rect: DOMRect;
}

export type SidebarSection =
  | 'profile'
  | 'checklist'
  | 'time'
  | 'versions'
  | 'extras'
  | 'settings'
  | 'share'
  | 'eeat'
  | 'surferseo'
  | null;
