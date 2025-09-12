import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Plus, X, ChevronLeft, Target } from 'lucide-react';
import { SecondaryKeywordModal } from './SecondaryKeywordModal';
import {
  getArticleDetail,
  updateArticle,
  getArticleTypes,
} from '../../../lib/services/topics.service';
import type { ArticleTypeOption } from '../../../lib/services/topics.service';
import type { Article } from '../../../lib/types';

interface LeftSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isOpen,
  onToggle,
}) => {
  const { articleId } = useParams<{ articleId: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [articleTypes, setArticleTypes] = useState<ArticleTypeOption[]>([]);
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch article details
  useEffect(() => {
    const fetchArticleData = async () => {
      if (!articleId) return;

      try {
        setLoading(true);
        setError(null);
        const [articleData, articleTypesData] = await Promise.all([
          getArticleDetail(articleId),
          getArticleTypes(),
        ]);

        setArticle(articleData);
        setArticleTypes(articleTypesData);
        setSecondaryKeywords((articleData.secondaryKeywords || []).map(kw => typeof kw === 'string' ? kw : kw.keyword));
      } catch (err) {
        console.error('Failed to fetch article data:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load article data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchArticleData();
  }, [articleId]);

  // Handle secondary keywords update
  const handleSecondaryKeywordsUpdate = async (newKeywords: string[]) => {
    if (!articleId || !article) return;

    try {
      await updateArticle(articleId, {
        secondary_keywords: newKeywords,
      });
      setSecondaryKeywords(newKeywords);
      // Update the article state to reflect the change
      setArticle((prev) =>
        prev ? { ...prev, secondaryKeywords: newKeywords.map(keyword => ({
          keyword,
          volume: null,
          competition: null,
          article_type: null
        })) } : null
      );
    } catch (err) {
      console.error('Failed to update secondary keywords:', err);
    }
  };

  // Handle article type change
  const handleArticleTypeChange = async (newArticleType: string) => {
    if (!articleId || !article) return;

    try {
      await updateArticle(articleId, {
        prompt_type: newArticleType,
      });
      setArticle((prev: any) =>
        prev ? { ...prev, articleType: newArticleType } : null
      );
    } catch (err) {
      console.error('Failed to update article type:', err);
    }
  };

  // Format date helper
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900';
      case 'pending approval':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900';
      case 'internal review':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (loading) {
    return (
      <div
        className={`bg-card border-r border-border transition-all duration-200 ${
          isOpen ? 'w-72' : 'w-0'
        } overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-medium text-sm text-foreground">
              Article Details
            </h2>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-accent rounded-md transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div
        className={`bg-card border-r border-border transition-all duration-200 ${
          isOpen ? 'w-72' : 'w-0'
        } overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-medium text-sm text-foreground">
              Article Details
            </h2>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-accent rounded-md transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-sm text-red-500 text-center">
              {error || 'Failed to load article data'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-card border-r border-border transition-all duration-200 ${
        isOpen ? 'w-72' : 'w-0'
      } overflow-hidden`}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-medium text-sm text-foreground">
            Article Details
          </h2>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-accent rounded-md transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-5">
            {/* Project */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">PROJECT</div>
              <div className="font-medium text-foreground">
                {article.relatedProject.name || 'N/A'}
              </div>
            </div>

            {/* Word Count */}
            <div>
              <div className="text-xs text-muted-foreground mb-1.5">
                WORD COUNT
              </div>
              <div className="bg-blue-50/50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-lg p-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-foreground font-medium">
                      {article.avgWordCount || 0}
                    </span>
                    <span className="text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-950 px-1.5 py-0.5 rounded text-xs font-medium">
                      Average
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Keyword */}
            <div>
              <div className="text-xs text-muted-foreground mb-1.5">
                PRIMARY KEYWORD
              </div>
              <div className="border border-purple-200 dark:border-purple-900 bg-purple-50/30 dark:bg-purple-950/30 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Target className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <span className="font-medium text-foreground text-xs truncate">
                      {article.keyword || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {article.volume || 0}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${getDifficultyColor(
                        article.keywordDifficulty
                      )}`}
                    >
                      {article.keywordDifficulty}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Keywords */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-xs text-muted-foreground">
                  SECONDARY KEYWORDS
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="h-6 w-6 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {secondaryKeywords.slice(0, 20).map((keyword, index) => (
                  <div
                    key={`secondary-keyword-${keyword}-${index}`}
                    className="group flex items-center gap-1.5 bg-muted hover:bg-muted/80 px-2.5 py-1.5 rounded text-xs transition-colors"
                  >
                    <span className="text-foreground">{keyword}</span>
                    <X
                      className="h-3 w-3 text-muted-foreground hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => {
                        const newKeywords = secondaryKeywords.filter(
                          (_, i) => i !== index
                        );
                        handleSecondaryKeywordsUpdate(newKeywords);
                      }}
                    />
                  </div>
                ))}
                {secondaryKeywords.length > 20 && (
                  <div className="text-xs text-muted-foreground px-2.5 py-1.5">
                    +{secondaryKeywords.length - 20} more
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Members - Removed for single-user application */}

            {/* Status & Article Type */}
            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">
                  STATUS
                </div>
                <span
                  className={`px-2.5 py-1 rounded text-xs font-medium border ${getStatusColor(
                    article.status
                  )}`}
                >
                  {article.status}
                </span>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">
                  ARTICLE TYPE
                </div>
                <select
                  className="h-8 w-full text-sm border border-border rounded px-2.5 focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                  value={article.articleType}
                  onChange={(e) => handleArticleTypeChange(e.target.value)}
                >
                  <option value={article.articleType}>
                    {article.articleType}
                  </option>
                  {articleTypes
                    .filter((type) => type.name !== article.articleType)
                    .map((type) => (
                      <option key={type._id} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Created by section removed for single-user application */}

            {/* Dates */}
            <div className="pt-4 border-t border-border space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Created</span>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>{formatDate(article.createdAt)}</span>
                </div>
              </div>
              {article.startDate && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Started</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{formatDate(article.startDate)}</span>
                  </div>
                </div>
              )}
              {article.dueDate && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Due Date</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{formatDate(article.dueDate)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Keyword Modal */}
      <SecondaryKeywordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddKeyword={(keyword) => {
          if (!secondaryKeywords.includes(keyword)) {
            const newKeywords = [...secondaryKeywords, keyword];
            handleSecondaryKeywordsUpdate(newKeywords);
          }
        }}
        onRemoveKeyword={(keyword) => {
          const newKeywords = secondaryKeywords.filter((k) => k !== keyword);
          handleSecondaryKeywordsUpdate(newKeywords);
        }}
        existingKeywords={secondaryKeywords}
      />
    </div>
  );
};
