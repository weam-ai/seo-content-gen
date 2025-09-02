export enum ArticleStatus {
  PENDING = 'pending',
  NOT_STARTED = 'not_started',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  INTERNAL_REVIEW = 'internal_review',
  AWAITING_FEEDBACK = 'awaiting_feedback',
  PUBLISHED = 'published',
}

export enum KeywordDifficulty {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export type KeywordDifficultyType = keyof typeof KeywordDifficulty;

export const ARTICLE_STATUS_CONST = [
  {
    label: 'Not Started',
    value: ArticleStatus.NOT_STARTED,
    isChecked: true,
    backgroundColor: 'outline-secondary',
  },
  {
    label: 'In Progress',
    value: ArticleStatus.IN_PROGRESS,
    isChecked: true,
    backgroundColor: 'outline-primary',
  },
  {
    label: 'Internal Review',
    value: ArticleStatus.INTERNAL_REVIEW,
    isChecked: true,
    backgroundColor: 'outline-warning',
  },
  {
    label: 'Awaiting Feedback',
    value: ArticleStatus.AWAITING_FEEDBACK,
    isChecked: true,
    backgroundColor: 'outline-info',
  },
  {
    label: 'Published',
    value: ArticleStatus.PUBLISHED,
    isChecked: false,
    backgroundColor: 'outline-success',
  },
  {
    label: 'Rejected',
    value: ArticleStatus.REJECTED,
    isChecked: false,
    backgroundColor: 'outline-danger',
  },
  {
    label: 'Pending Approval',
    value: ArticleStatus.PENDING,
    isChecked: true,
    backgroundColor: 'outline-secondary',
  },
] as const;

export enum ArticleFrom {
  OPEN_AI = 'open_ai',
  GEMINI = 'gemini',
  CLAUDE = 'claude',
}

export interface TargetedKeyword {
  keyword: string;
  promptTypeId: string;
}

export interface TypographySettings {
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  blockSpacing?: number;
}

export interface AISettings {
  model?: string;
  temperature?: number;
  documentLanguage?: string;
  tone?: string;
}

export interface ArticleSettings {
  theme?: 'light' | 'dark';
  focusMode?: boolean;
  typography?: TypographySettings;
  ai?: AISettings;
}
