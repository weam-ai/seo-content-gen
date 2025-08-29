import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  FileText,
  Info,
  Plus,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import { usePasteHandler } from '@/utils/pasteParser';
import { toast } from '@/components/ui/use-toast';
import { getRecommendedKeywords } from '@/lib/services/topics.service';

// --- Types ---


export interface TaskSidebarPrimaryKeyword {
  value: string;
  volume?: number;
  difficulty?: string;
}

export interface TaskSidebarArticleTypeOption {
  id: string;
  name: string;
}

export interface TaskSidebarBusinessDetails {
  description?: string;
  summary?: string;
  audience?: string;
  details?: string;
}

export interface TaskSidebarCreatedBy {
  name: string;
  avatar?: string;
  role?: string;
}

export interface TaskSidebarStatusOption {
  value: string;
  label: string;
}

interface RecommendedKeyword {
  keyword: string;
  search_volume: number;
}

export interface TaskSidebarProps {
  topicId?: string;
  projectName: { id: string; name: string };
  businessDetails: TaskSidebarBusinessDetails | React.ReactNode;
  onShowBusinessDetails?: () => void;
  primaryKeyword: TaskSidebarPrimaryKeyword;
  secondaryKeywords: string[];
  newSecondaryKeyword: string;
  onNewSecondaryKeywordChange: (val: string) => void;
  onAddSecondaryKeyword: () => void | Promise<void>;
  onRemoveSecondaryKeyword: (idx: number) => void | Promise<void>;
  onAddMultipleSecondaryKeywords?: (keywords: string[]) => void | Promise<void>;
  addingKeyword?: boolean;

  status: string;
  statusOptions: TaskSidebarStatusOption[];
  onStatusChange: (value: string) => void | Promise<void>;
  articleType: string;
  articleTypeOptions: TaskSidebarArticleTypeOption[];
  onArticleTypeChange: (value: string) => void | Promise<void>;
  articleTypeLoading?: boolean;
  createdAt: Date | string;
  startDate?: Date | string;
  dueDate?: Date | string;
  customSections?: React.ReactNode[];
  children?: React.ReactNode;

  recommendedKeywordsUI?: React.ReactNode;
}

// --- Component ---
export const TaskSidebar: React.FC<TaskSidebarProps> = ({
  topicId,
  projectName,
  businessDetails,
  onShowBusinessDetails,
  primaryKeyword,
  secondaryKeywords,
  newSecondaryKeyword,
  onNewSecondaryKeywordChange,
  onAddSecondaryKeyword,
  onRemoveSecondaryKeyword,
  onAddMultipleSecondaryKeywords,
  addingKeyword,

  status,
  statusOptions,
  onStatusChange,
  articleType,
  articleTypeOptions,
  onArticleTypeChange,
  articleTypeLoading,
  createdAt,
  startDate,
  dueDate,
  customSections,
  children,

  recommendedKeywordsUI,
}) => {
  // Internal state for recommended keywords
  const [recommendedKeywords, setRecommendedKeywords] = useState<
    RecommendedKeyword[]
  >([]);

  // Fetch recommended keywords when topicId is available
  useEffect(() => {
    const fetchRecommendedKeywords = async () => {
      if (!topicId) return;

      try {
        const data = await getRecommendedKeywords(topicId);
        // Filter out keywords that are already in secondary keywords
        const filteredKeywords = data.filter(
          (k: any) => !secondaryKeywords.includes(k.keyword)
        );
        setRecommendedKeywords(filteredKeywords);
      } catch (error) {
        console.error('Failed to fetch recommended keywords:', error);
        setRecommendedKeywords([]);
      } finally {
      }
    };

    fetchRecommendedKeywords();
  }, [topicId, secondaryKeywords]);

  // Handle adding recommended keyword to secondary keywords
  const handleAddRecommendedKeyword = async (keyword: string) => {
    try {
      if (onAddMultipleSecondaryKeywords) {
        await onAddMultipleSecondaryKeywords([keyword]);
        toast({
          title: 'Success',
          description: `Added "${keyword}" to secondary keywords`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add keyword',
        variant: 'destructive',
      });
    }
  };

  // Color maps (can be extended or passed as props)
  const difficultyColors: Record<string, string> = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };

  // Status color map for articles and topics
  const statusColors: Record<string, string> = {
    'not started': 'bg-gray-100 text-gray-800 border-gray-200',
    'in progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'internal review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'awaiting feedback': 'bg-orange-100 text-orange-800 border-orange-200',
    published: 'bg-green-100 text-green-800 border-green-200',
    'pending approval': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'mark as rejected': 'bg-red-100 text-red-800 border-red-200',
    'mark as approved': 'bg-green-100 text-green-800 border-green-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    // fallback
    default: 'bg-muted text-muted-foreground border-border',
  };

  // Helper
  const formatDate = (date?: Date | string) => {
    if (!date) return '';
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    return date.toLocaleDateString();
  };

  // Removed unused functions getRoleDisplayName and isRoleObject

  function getStatusLabel(status: string) {
    if (status === 'not_started') {
      return 'Not Started';
    } else if (
      status === 'approved' ||
      status === 'mark as approved'
    ) {
      return 'Approved';
    } else if (status === 'rejected' || status === 'mark as rejected') {
      return 'Rejected';
    } else if (status === 'pending' || status === 'pending approval') {
      return 'Pending Approval';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  return (
    <Card className="hover-lift bg-card/50 backdrop-blur-sm border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
          Task Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Project
          </label>
          <a
            href={`/projects/${projectName.id}`}
            className="flex items-center gap-1 group text-sm font-medium hover:text-[hsl(var(--razor-primary))] transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* <svg className="h-3 w-3 group-hover:text-[hsl(var(--razor-primary))] transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m7-1V7m0 0h-4m4 0L10 17" /></svg> */}
            <span className="truncate group-hover:text-[hsl(var(--razor-primary))] transition-colors">
              {projectName.name}
            </span>
          </a>
        </div>

        {/* Business Details Button/Section (customizable) */}
        {React.isValidElement(businessDetails) ? (
          businessDetails
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={onShowBusinessDetails}
          >
            <FileText className="h-4 w-4 mr-2" />
            Business Details
          </Button>
        )}

        {/* Custom Sections (e.g. Outline, Word Count, etc.) */}
        {customSections &&
          customSections.map((section, idx) => (
            <React.Fragment key={`custom-section-${idx}`}>{section}</React.Fragment>
          ))}

        {/* Primary Keyword */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Primary Keyword
          </label>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[hsl(var(--razor-primary))]" />
            <span className="text-sm font-medium">{primaryKeyword.value}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>{primaryKeyword.volume?.toLocaleString()} volume</span>
            {primaryKeyword.difficulty && (
              <Badge
                className={difficultyColors[primaryKeyword.difficulty]}
                variant="outline"
              >
                {primaryKeyword.difficulty}
              </Badge>
            )}
          </div>
        </div>

        {/* Secondary Keywords */}
        {secondaryKeywords && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Secondary Keywords
            </label>
            <div className="flex gap-2">
              <Input
                value={newSecondaryKeyword}
                onChange={(e) => onNewSecondaryKeywordChange(e.target.value)}
                placeholder="Add keyword or paste from spreadsheet"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddSecondaryKeyword();
                  }
                }}
                onPaste={usePasteHandler(
                  (items) => {
                    // Filter out duplicates and invalid keywords
                    const validItems = items.filter((item) => {
                      const keyword = item.trim().toLowerCase();
                      // Skip empty items
                      if (!keyword) return false;
                      // Skip if matches primary keyword
                      if (primaryKeyword.value.trim().toLowerCase() === keyword)
                        return false;
                      // Skip if already in secondary keywords
                      if (
                        secondaryKeywords.some(
                          (kw: string) => kw.trim().toLowerCase() === keyword
                        )
                      )
                        return false;
                      return true;
                    });

                    if (
                      validItems.length > 0 &&
                      onAddMultipleSecondaryKeywords
                    ) {
                      onAddMultipleSecondaryKeywords(
                        validItems.map((item) => item.trim())
                      );
                      // Clear the input field
                      onNewSecondaryKeywordChange('');
                    }
                  },
                  {
                    trimItems: true,
                    filterEmpty: true,
                    itemSeparator: ',',
                  }
                )}
                disabled={addingKeyword}
              />
              <Button
                size="sm"
                onClick={onAddSecondaryKeyword}
                disabled={addingKeyword || !newSecondaryKeyword.trim()}
                className="px-2"
                variant="outline"
                title="Add keyword"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {/* Helper text for paste functionality */}
            <div className="text-xs text-muted-foreground mb-2">
              Tip: You can paste multiple keywords from Google Sheets or Excel.
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {secondaryKeywords.map((keyword, idx) => (
                <Badge
                  key={`secondary-${keyword}-${idx}`}
                  variant="outline"
                  className="text-xs flex items-center gap-1"
                >
                  {keyword}
                  <button
                    type="button"
                    className="ml-1 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveSecondaryKeyword(idx)}
                    disabled={addingKeyword}
                    title="Remove keyword"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* Recommended Keywords */}
            {recommendedKeywords && recommendedKeywords.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Recommended Keywords
                </div>
                <div className="flex flex-wrap gap-1">
                  {recommendedKeywords
                    .filter((keyword) => {
                      const keywordText = keyword.keyword.trim().toLowerCase();
                      const primaryKeywordText = primaryKeyword.value
                        .trim()
                        .toLowerCase();
                      const secondaryKeywordTexts = secondaryKeywords.map(
                        (kw: string) => kw.trim().toLowerCase()
                      );

                      // Exclude primary keyword and already added secondary keywords
                      return (
                        keywordText !== primaryKeywordText &&
                        !secondaryKeywordTexts.includes(keywordText)
                      );
                    })
                    .map((keyword) => (
                      <Badge
                        key={`recommended-${keyword.keyword}`}
                        variant="secondary"
                        className="cursor-pointer hover:bg-[hsl(var(--razor-primary))]/10 hover:border-[hsl(var(--razor-primary))]/20 transition-colors text-xs flex items-center gap-1"
                        onClick={() => {
                          handleAddRecommendedKeyword(keyword.keyword.trim());
                        }}
                        title={`Add "${keyword.keyword
                          }" (${keyword.search_volume.toLocaleString()} volume)`}
                      >
                        <span>{keyword.keyword}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {keyword.search_volume.toLocaleString()}
                        </span>
                        <Plus className="h-3 w-3" />
                      </Badge>
                    ))}
                </div>
                {recommendedKeywords.filter((keyword) => {
                  const keywordText = keyword.keyword.trim().toLowerCase();
                  const primaryKeywordText = primaryKeyword.value
                    .trim()
                    .toLowerCase();
                  const secondaryKeywordTexts = secondaryKeywords.map(
                    (kw: string) => kw.trim().toLowerCase()
                  );
                  return (
                    keywordText !== primaryKeywordText &&
                    !secondaryKeywordTexts.includes(keywordText)
                  );
                }).length === 0 && (
                    <div className="text-xs text-muted-foreground">
                      All recommended keywords have been added
                    </div>
                  )}
              </div>
            )}

            {recommendedKeywordsUI}
          </div>
        )}



        {/* Status */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            Status
          </label>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger
              className={`w-fit min-w-[80px] px-1.5 py-0 rounded-full font-semibold border-0 shadow-none focus:ring-0 focus:outline-none text-[11px] h-6 ${statusColors[status?.toLowerCase?.()] || statusColors['default']
                }`}
            >
              <span className="capitalize">{getStatusLabel(status)}</span>
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.value === 'mark as approved'
                    ? 'Approved'
                    : opt.value === 'mark as rejected'
                      ? 'Rejected'
                      : opt.value === 'pending'
                        ? 'Pending Approval'
                        : opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Article Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Article Type
          </label>
          {/* Check if status allows editing article type */}
          {status === 'pending' || status === 'rejected' ? (
            <Select
              value={articleType}
              onValueChange={onArticleTypeChange}
              disabled={articleTypeLoading}
            >
              <SelectTrigger className="w-full">
                {/* Custom rendering to trim the selected value's label */}
                {(() => {
                  const selected = articleTypeOptions.find(
                    (type) => type.id === articleType
                  );
                  return selected ? (
                    <span className="truncate">{selected.name.trim()}</span>
                  ) : (
                    <span className="truncate">
                      {articleTypeLoading ? 'Loading...' : 'Select article type'}
                    </span>
                  );
                })()}
              </SelectTrigger>
              <SelectContent>
                {articleTypeOptions.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name.trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            /* Read-only display with badge styling on next line */
            <div className="w-fit min-w-[80px] px-1.5 py-0 rounded-full font-semibold border-0 shadow-none text-[11px] h-6 bg-gray-100 text-gray-800 border-gray-200 flex items-center justify-center">
              {(() => {
                const selected = articleTypeOptions.find(
                  (type) => type.id === articleType
                );
                return selected ? (
                  <span className="capitalize truncate">{selected.name.trim()}</span>
                ) : (
                  <span className="capitalize truncate text-muted-foreground">
                    {articleTypeLoading ? 'Loading...' : 'No Type'}
                  </span>
                );
              })()}
            </div>
          )}
        </div>



        {/* Dates */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Created Date
          </label>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {formatDate(createdAt)}
          </div>
        </div>
        {startDate && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Start Date
            </label>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {formatDate(startDate)}
            </div>
          </div>
        )}
        {dueDate && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Due Date
            </label>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {formatDate(dueDate)}
            </div>
          </div>
        )}

        {/* Children for extra actions (e.g. revert button) */}
        {children}
      </CardContent>
    </Card>
  );
};

export default TaskSidebar;
