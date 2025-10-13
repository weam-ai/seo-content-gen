import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import type { Article, ArticleStatus } from '@/lib/types';
import {
  Plus,
  Eye,
  Edit,
  Copy,
  MoreHorizontal,
  ExternalLink,
  Target,
  TrendingUp,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  Settings,
  Brain,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
// Removed unused Avatar import
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getArticles, GetArticlesParams, getArticlesCalendarView, GetArticlesCalendarParams, updateArticle, generateOutline, getRecommendedKeywords, deleteArticle } from '@/lib/services/topics.service';
import RegenerateTitleModal from '@/components/topics/RegenerateTitleModal';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { OutlineRequiredModal } from '@/components/ui/OutlineRequiredModal';
import SecondaryKeywordModal from '../topics/SecondaryKeywordModal';
import { Pagination } from '@/components/ui/simple-pagination';
import FilterUtilityBar from '@/components/topics/FilterUtilityBar';
import projectService from '@/lib/services/project.service';
// Removed user and agency service imports for single-user application
import { useDebounce } from '@/hooks/use-debounce';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
// useAuthStore import removed - not used in single-user application
// Removed ROLE_ACCESS_LEVELS import for single-user application

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function getMonthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
function getWeekStart(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}
function getWeekEnd(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() + (6 - d.getDay()));
  return d;
}
function getDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function getDayEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Helper functions for localStorage
const getStoredFilters = () => {
  try {
    const stored = localStorage.getItem('articles-filters');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveFiltersToStorage = (filters: any) => {
  try {
    localStorage.setItem('articles-filters', JSON.stringify(filters));
  } catch {
    // Ignore localStorage errors
  }
};

export default function Articles() {
  // user removed - not used in single-user application
  const navigate = useNavigate();
  const location = useLocation();
  const [articles, setArticles] = useState<Article[]>([]);
  
  // Initialize filters from localStorage or defaults
  const storedFilters = getStoredFilters();
  const [searchQuery, setSearchQuery] = useState(storedFilters.searchQuery || '');
  const [statusFilter, setStatusFilter] = useState<string>(storedFilters.statusFilter || 'all');
  const [projectFilter, setProjectFilter] = useState<string>(storedFilters.projectFilter || 'all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>(
    storedFilters.viewMode || 'grid'
  );
  // Member and agency filters removed for single-user application
  
  // Pagination state
  const [page, setPage] = useState(storedFilters.page || 1);
  const [pageSize, setPageSize] = useState(storedFilters.pageSize || 12);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  // Initialize sortOrder with location state if available, otherwise use stored or default
  const [sortOrder, setSortOrder] = useState<string>(() => {
    return location.state?.initialSort || storedFilters.sortOrder || 'created_at:desc';
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsPopoverOpen, setProjectsPopoverOpen] = useState(false);
  // Removed team member and agency state for single-user application


  // Article status options for the dropdown
  const articleStatusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending Approval' },
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'internal_review', label: 'Internal Review' },
    { value: 'awaiting_feedback', label: 'Awaiting Feedback' },
    { value: 'published', label: 'Published' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // Custom sort options for articles
  const articleSortOptions = [
    {
      group: 'Created',
      options: [
        { value: 'created_at:desc', label: 'Created (Newest)' },
        { value: 'created_at:asc', label: 'Created (Oldest)' },
      ],
    },
    {
      group: 'Updated',
      options: [
        { value: 'updated_at:desc', label: 'Updated (Newest)' },
        { value: 'updated_at:asc', label: 'Updated (Oldest)' },
      ],
    },
    {
      group: 'Approved',
      options: [
        { value: 'approved_at:desc', label: 'Approved (Newest)' },
        { value: 'approved_at:asc', label: 'Approved (Oldest)' },
      ],
    },
    {
      group: 'Name',
      options: [
        { value: 'name:asc', label: 'Name (A-Z)' },
        { value: 'name:desc', label: 'Name (Z-A)' },
      ],
    },
  ];

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Check if user is agency user (agency owner or agency member)
  // Single user application - no role restrictions
  const isAgencyUser = false;

  // Calendar view state
  const [calendarView] = useState<'month' | 'week' | 'day'>('month');
  const [calendarCurrentDate, setCalendarCurrentDate] = useState<Date>(new Date());
  const [calendarStartDate, setCalendarStartDate] = useState<Date>(getMonthStart(new Date()));
  const [calendarEndDate, setCalendarEndDate] = useState<Date>(getMonthEnd(new Date()));
  // Module type for calendar API: 'topics' or 'articles' (set here, not in UI)
  const calendarModule: 'topics' | 'article' = 'article';

  // Add state to store calendar API raw data for status grouping
  const [calendarStatusData, setCalendarStatusData] = useState<any>({});

  // State to track which calendar cell's '+n more' tooltip is open
  const [openTooltipCell, setOpenTooltipCell] = useState<string | null>(null);
  // Ref to track if the tooltip is pinned by click
  const pinnedTooltipCell = useRef<string | null>(null);

  // State for status change confirmation dialog
  const [showPendingConfirmDialog, setShowPendingConfirmDialog] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    articleId: string;
    newStatus: string;
  } | null>(null);

  // State for approval flow modals
  const [showOutlineDialog, setShowOutlineDialog] = useState(false);
  const [showAddKeywordModal, setShowAddKeywordModal] = useState(false);
  const [currentApprovalArticle, setCurrentApprovalArticle] = useState<Article | null>(null);
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [recommendedKeywords, setRecommendedKeywords] = useState<any[]>([]);
  const [, setRecommendedLoading] = useState(false);

  // State for regenerate title functionality
  const [showRegenerateTitleModal, setShowRegenerateTitleModal] = useState(false);
  const [regenerateTitleArticle, setRegenerateTitleArticle] = useState<Article | null>(null);

  // State for delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Clear navigation state after component mounts to prevent persistence on refresh
  useEffect(() => {
    if (location.state?.initialSort) {
      // Clear the state after using it to prevent it from persisting on refresh
      window.history.replaceState({}, document.title);
    }
  }, []); // Only run once on mount

  // Save filters to localStorage whenever they change
  useEffect(() => {
    const filters = {
      searchQuery,
      statusFilter,
      projectFilter,
      viewMode,
      // Member and agency filters removed for single-user application
      page,
      pageSize,
      sortOrder,
    };
    saveFiltersToStorage(filters);
  }, [
    searchQuery,
    statusFilter,
    projectFilter,
    viewMode,
    // Member and agency filters removed for single-user application
    page,
    pageSize,
    sortOrder,
  ]);

  // Update URL when filters change
  useEffect(() => {
    // const paramsArr = [ // Removed
    //   ['search', searchQuery], // Removed
    //   ['status', statusFilter !== 'all' ? statusFilter : undefined], // Removed
    //   ['project', projectFilter !== 'all' ? projectFilter : undefined], // Removed
    //   [ // Removed
    //     'staff', // Removed
    //     assignedStaffFilter !== 'all' ? assignedStaffFilter : undefined, // Removed
    //   ], // Removed
    //   ['agency', agencyFilter !== 'all' ? agencyFilter : undefined], // Removed
    // ].filter(([_, v]) => v !== undefined && v !== ''); // Removed
    // setSearchParams(paramsArr as [string, string][]); // Removed
  }, [
    searchQuery,
    statusFilter,
    projectFilter,
    // Member and agency filters removed for single-user application
    // setSearchParams, // Removed
  ]);

  // Removed agency fetching for single-user application

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      setProjectsLoading(true);
      try {
        const response = await projectService.getProjects({
          page: 1,
          limit: -1, // Fetch all projects for the filter
        });
        if (response.status) {
          setProjects(response.data);
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch projects',
          variant: 'destructive',
        });
      } finally {
        setProjectsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Removed member fetching for single-user application

  // Update calendar date range when view or current date changes
  useEffect(() => {
    if (calendarView === 'month') {
      setCalendarStartDate(getMonthStart(calendarCurrentDate));
      setCalendarEndDate(getMonthEnd(calendarCurrentDate));
    } else if (calendarView === 'week') {
      setCalendarStartDate(getWeekStart(calendarCurrentDate));
      setCalendarEndDate(getWeekEnd(calendarCurrentDate));
    } else if (calendarView === 'day') {
      setCalendarStartDate(getDayStart(calendarCurrentDate));
      setCalendarEndDate(getDayEnd(calendarCurrentDate));
    }
  }, [calendarView, calendarCurrentDate]);

  // Add a ref to track last view mode
  const lastViewModeRef = useRef(viewMode);

  // Fetch articles when filters or pagination change
  useEffect(() => {
    async function fetchArticles() {
      setLoading(true);
      try {
        if (viewMode === 'calendar') {
          const calendarParams: GetArticlesCalendarParams & any = {
            module: calendarModule,
            sort: sortOrder, // <-- UPDATED
            status: statusFilter && statusFilter !== '' && statusFilter !== 'all'
              ? statusFilter
              : 'pending,rejected,not_started,in_progress,internal_review,awaiting_feedback,published',
            start_date: calendarStartDate.toISOString().slice(0, 10),
            end_date: calendarEndDate.toISOString().slice(0, 10),
          };
          // Member and agency filter params removed for single-user application
          if (projectFilter !== 'all') calendarParams.search_by_project = projectFilter;
          if (debouncedSearchQuery.trim()) calendarParams.search = debouncedSearchQuery.trim();
          console.groupCollapsed('[DEBUG] Articles Calendar API Payload');
          console.groupEnd();
          const res = await getArticlesCalendarView(calendarParams);
          setCalendarStatusData(res.data || {});
          // Flatten all statuses into a single array for rendering
          const allArticles = Object.values(res.data || {}).flat();
          setArticles(allArticles);
          setTotalRecords(allArticles.length);
        } else {
          // Determine which statuses to send
          const effectiveStatus = statusFilter && statusFilter !== '' ? statusFilter : 'all';
          const allStatuses = 'pending,rejected,not_started,in_progress,internal_review,awaiting_feedback,published';
          const params: GetArticlesParams = {
            sort: sortOrder, // <-- UPDATED
            limit: pageSize,
            page,
            search_by_status: effectiveStatus === 'all' ? allStatuses : effectiveStatus,
            // Member and agency filter params removed for single-user application
            ...(projectFilter !== 'all' && { search_by_project: projectFilter }),
            ...(debouncedSearchQuery.trim() && { search: debouncedSearchQuery.trim() }),
          };
          console.groupCollapsed('[DEBUG] Articles List API Payload');
          console.groupEnd();
          const res = await getArticles<Article>(params);
          const filtered = Array.isArray(res.data) ? res.data : [];
          setArticles(filtered);
          setTotalRecords(res.pagination?.total_records || 0);
        }
      } catch (err: any) {
        console.error('[DEBUG] fetchArticles error', err);
        toast({
          title: 'Error',
          description: err.message || 'Failed to fetch articles',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    pageSize,
    // Member and agency filters removed for single-user application
    projectFilter,
    debouncedSearchQuery,
    statusFilter,
    viewMode,
    calendarStartDate,
    calendarEndDate,
    calendarView,
    calendarModule,
    sortOrder, // <-- NEW
  ]);

  // Agency filter reset removed for single-user application

  // Reset page to 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  // Member filter reset removed for single-user application

  // Reset page to 1 when project filter changes
  useEffect(() => {
    setPage(1);
  }, [projectFilter]);

  useEffect(() => {
    // If switching from calendar to grid/list, force fetch articles
    if (
      (lastViewModeRef.current === 'calendar' && viewMode !== 'calendar') ||
      (lastViewModeRef.current !== 'calendar' && viewMode === 'calendar')
    ) {
      setArticles([]); // Clear articles to avoid stale/malformed data
      setTotalRecords(0);
      // fetchArticles will run due to viewMode in deps
    }
    lastViewModeRef.current = viewMode;
  }, [viewMode]);

  const statusColors: Record<ArticleStatus, string> = {
    'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'not started': 'bg-gray-100 text-gray-800 border-gray-200',
    'in progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'internal review': 'bg-violet-100 text-violet-800 border-violet-200',
    'awaiting feedback': 'bg-orange-100 text-orange-800 border-orange-200',
    'published': 'bg-green-100 text-green-800 border-green-200',
    'rejected': 'bg-red-100 text-red-800 border-red-200',
    'approved': 'bg-green-100 text-green-800 border-green-200',
    'mark as approved': 'bg-green-100 text-green-800 border-green-200',
    'mark as rejected': 'bg-red-100 text-red-800 border-red-200',
    'not_started': 'bg-gray-100 text-gray-800 border-gray-200',
    'in_progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'internal_review': 'bg-violet-100 text-violet-800 border-violet-200',
    'awaiting_feedback': 'bg-orange-100 text-orange-800 border-orange-200',
  };

  const difficultyColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };

  const handleCopyLink = (articleId: string) => {
    navigator.clipboard.writeText(
      `${window.location.origin}/articles/${articleId}`
    ).then(() => {
      toast({
        title: 'Link copied',
        description: 'Article link has been copied to clipboard.',
      });
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      toast({
        title: 'Copy Failed',
        description: 'Could not copy link to clipboard. Your browser might not support this feature or requires a secure connection (HTTPS).',
        variant: 'destructive',
      });
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setProjectFilter('all');
    // Member and agency filter clearing removed for single-user application
    setPage(1);
    setSortOrder('created_at:desc');
    setViewMode('grid');
    setPageSize(12);
    
    // Clear from localStorage
    try {
      localStorage.removeItem('articles-filters');
    } catch {
      // Ignore localStorage errors
    }
    
    toast({
      title: 'Filters Cleared',
      description: 'All filters have been reset and showing all articles',
    });
  };

  // Helper function to determine if article is in topic-style interface
  const isTopicStyleInterface = (article: Article) => {
    return article.status === 'rejected' || article.status === 'pending';
  };

  // Helper function to determine if regenerate title should be available
  const canRegenerateTitle = (article: Article) => {
    return article.status === 'rejected' || article.status === 'pending';
  };

  // Get status options based on article type
  const getStatusOptions = (article: Article) => {
    if (isTopicStyleInterface(article)) {
      return [
        { value: 'pending', label: 'Pending Approval' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'not_started', label: 'Approved' },
      ];
    } else {
      return [
        { value: 'pending', label: 'Pending Approval' },
        { value: 'not started', label: 'Not Started' },
        { value: 'in progress', label: 'In Progress' },
        { value: 'internal review', label: 'Internal Review' },
        { value: 'awaiting feedback', label: 'Awaiting Feedback' },
        { value: 'published', label: 'Published' },
      ];
    }
  };

  // Handle status change
  const handleStatusChange = async (articleId: string, newStatus: string, currentStatus: string) => {
    const article = articles.find(a => a._id === articleId);
    if (!article) return;

    // Show confirmation dialog if changing to pending approval in regular article interface
    if (newStatus === 'pending' && currentStatus !== 'pending') {
      if (!isTopicStyleInterface(article)) {
        setPendingStatusChange({ articleId, newStatus });
        setShowPendingConfirmDialog(true);
        return;
      }
    }

    // Handle approval with outline check for topic-style interface
    if (newStatus === 'not_started' && isTopicStyleInterface(article)) {
      await handleApproveWithOutlineCheck(article);
      return;
    }

    // Proceed with status change
    await updateArticleStatus(articleId, newStatus);
  };

  // Handle approve with outline check (similar to ArticleDetail.tsx)
  const handleApproveWithOutlineCheck = async (article: Article) => {
    if (!article.generated_outline || article.generated_outline.trim() === '') {
      setCurrentApprovalArticle(article);
      setShowOutlineDialog(true);
      return;
    }
    // If outline exists, show modal to optionally add secondary keyword
    setCurrentApprovalArticle(article);
    await fetchRecommendedKeywords(article._id);
    setShowAddKeywordModal(true);
  };

  // Generate outline for article
  const handleGenerateOutline = async () => {
    if (!currentApprovalArticle) return;
    setOutlineLoading(true);
    try {
      const outlineText = await generateOutline(currentApprovalArticle._id);
      // Update the article in local state
      setArticles(prevArticles =>
        prevArticles.map(article =>
          article._id === currentApprovalArticle._id
            ? { ...article, generated_outline: outlineText }
            : article
        )
      );
      setCurrentApprovalArticle(prev => prev ? { ...prev, generated_outline: outlineText } : prev);
      toast({
        title: 'Outline generated',
        description: 'The outline was generated successfully.',
      });
      setShowOutlineDialog(false);
      // Show secondary keyword modal after outline generation
      await fetchRecommendedKeywords(currentApprovalArticle._id);
      setShowAddKeywordModal(true);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to generate outline due to server error',
        variant: 'destructive',
      });
    } finally {
      setOutlineLoading(false);
    }
  };

  // Fetch recommended keywords
  const fetchRecommendedKeywords = async (articleId: string) => {
    setRecommendedLoading(true);
    try {
      const data = await getRecommendedKeywords(articleId);
      const article = articles.find(a => a._id === articleId);
      setRecommendedKeywords(
        data.filter(
          (k: any) => !(article?.secondaryKeywords || []).includes(k.keyword)
        )
      );
    } catch (e) {
      setRecommendedKeywords([]);
    } finally {
      setRecommendedLoading(false);
    }
  };

  // Update article status
  const updateArticleStatus = async (articleId: string, newStatus: string) => {
    try {
      // Map UI value to backend value if needed
      let backendStatus = newStatus;
      if (newStatus === 'not started') backendStatus = 'not_started';
      else if (newStatus === 'in progress') backendStatus = 'in_progress';
      else if (newStatus === 'internal review') backendStatus = 'internal_review';
      else if (newStatus === 'awaiting feedback') backendStatus = 'awaiting_feedback';
      else if (newStatus === 'published') backendStatus = 'published';
      else if (newStatus === 'pending') backendStatus = 'pending';
      else if (newStatus === 'rejected') backendStatus = 'rejected';
      else if (newStatus === 'not_started') backendStatus = 'not_started';

      await updateArticle(articleId, { status: backendStatus });

      // Update the article in the local state
      setArticles(prevArticles =>
        prevArticles.map(article =>
          article._id === articleId
            ? { ...article, status: newStatus as ArticleStatus }
            : article
        )
      );

      toast({
        title: 'Status updated',
        description: 'Article status updated successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  // Handle regenerate title
  const handleRegenerateTitle = (article: Article) => {
    setRegenerateTitleArticle(article);
    setShowRegenerateTitleModal(true);
  };

  // Handle delete article
  const handleDeleteArticle = (article: Article) => {
    setArticleToDelete(article);
    setShowDeleteDialog(true);
  };

  // Confirm delete article
  const handleConfirmDelete = async () => {
    if (!articleToDelete) return;
    
    setDeleteLoading(true);
    try {
      await deleteArticle(articleToDelete._id);
      
      // Remove article from local state
      setArticles(prevArticles => 
        prevArticles.filter(article => article._id !== articleToDelete._id)
      );
      
      // Update total records
      setTotalRecords(prev => prev - 1);
      
      toast({
        title: 'Article deleted',
        description: 'The article has been successfully deleted.',
      });
      
      setShowDeleteDialog(false);
      setArticleToDelete(null);
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the article. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle regenerate title save and redirect
  const handleRegenerateTitleSaveAndRedirect = async (newTitle: string) => {
    if (!regenerateTitleArticle) return;

    try {
      // Update the article title
      await updateArticle(regenerateTitleArticle._id, { name: newTitle });

      // Update local state
      setArticles(prevArticles =>
        prevArticles.map(article =>
          article._id === regenerateTitleArticle._id
            ? { ...article, title: newTitle }
            : article
        )
      );

      // Close modal
      setShowRegenerateTitleModal(false);
      setRegenerateTitleArticle(null);

      // Show success toast
      toast({
        title: 'Title updated',
        description: 'Article title updated successfully. Redirecting to regenerate outline...',
      });

      // Redirect to article detail page with auto-regenerate outline parameter
      navigate(`/articles/${regenerateTitleArticle._id}?autoRegenerateOutline=true`);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update title',
        variant: 'destructive',
      });
    }
  };

  return (
    <TooltipProvider>
      {/* Minimal Tooltip Test Block - REMOVE after testing */}
      {/* End Minimal Tooltip Test Block */}
      <div className="">
        {/* Main Content */}
        <main className="container mx-auto md:px-4 px-2 md:py-8 py-4">
          <PageHeader
            title="Articles"
            description="Create, manage, and track content articles from approval to publication"
          >
            <Button
              className=""
              variant="outline"
              size="sm"
              onClick={() => navigate('/articles/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </PageHeader>

          {/* Filters and Search */}
          <FilterUtilityBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            projectFilter={projectFilter}
            setProjectFilter={setProjectFilter}
            projects={projects}
            projectsLoading={projectsLoading}
            projectsPopoverOpen={projectsPopoverOpen}
            setProjectsPopoverOpen={setProjectsPopoverOpen}
            // Member and agency filter props removed for single-user application
            clearFilters={clearFilters}
            viewMode={viewMode}
            setViewMode={setViewMode}
            statusOptions={articleStatusOptions}
            sortOrder={sortOrder} // <-- NEW
            setSortOrder={setSortOrder} // <-- NEW
            sortOptions={articleSortOptions} // <-- NEW
            hideAgencyFilter={isAgencyUser} // <-- NEW
          />

          {/* Articles Views */}
          {loading ? (
            <div className="text-center py-12">
              <div className="subtle-float">
                <div className="md:w-24 md:h-24 w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center gentle-glow">
                  <FileText className="md:h-12 md:w-12 h-9 w-9 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-1">Loading articles...</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                {searchQuery || statusFilter !== 'all' || projectFilter !== 'all'
                  ? 'Please wait while we load the articles'
                  : 'Articles will appear here once topics are approved'}
              </p>
            </div>
          ) : viewMode !== 'calendar' && articles.length === 0 ? (
            <div className="text-center py-12">
              <div className="subtle-float">
                <div className="md:w-24 md:h-24 w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center gentle-glow">
                  <FileText className="md:h-12 md:w-12 h-9 w-9 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-1">No articles found</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                {searchQuery || statusFilter !== 'all' || projectFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Articles will appear here once topics are approved'}
              </p>
              <Button
                className=""
                onClick={() => navigate('/articles/new')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Article
              </Button>
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articles.map((article) => (
                    <Card
                      key={article._id}
                      className="group hover:shadow-lg transition-all duration-200 hover:border-[hsl(var(--razor-primary))] hover:shadow-[hsl(var(--razor-primary))]/10"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <Link to={`/articles/${article._id}`}>
                              <h3 className="font-semibold text-lg hover:text-gray-800 transition-colors cursor-pointer">
                                {article.title}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {article.relatedProject ? (
                                <Link to={`/projects/${article.relatedProject._id}`} className="flex items-center gap-1 group">
                                  <ExternalLink className="h-3 w-3 group-hover:text-gray-800 transition-colors" />
                                  <span className="truncate group-hover:text-gray-800 transition-colors">{article.relatedProject.name}</span>
                                </Link>
                              ) : (
                                <span className="text-red-500">No Project</span>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleCopyLink(article._id)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/articles/${article._id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/articles/${article._id}`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              {canRegenerateTitle(article) && (
                                <DropdownMenuItem
                                  onClick={() => handleRegenerateTitle(article)}
                                >
                                  <Brain className="h-4 w-4 mr-2" />
                                  Regenerate Title
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <Settings className="h-4 w-4 mr-2" />
                                  Change Status
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {getStatusOptions(article).map((option) => (
                                    <DropdownMenuItem
                                      key={option.value}
                                      onClick={() => handleStatusChange(article._id, option.value, article.status)}
                                      disabled={article.status === option.value}
                                    >
                                      {option.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteArticle(article)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Article
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Status */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge
                              className={statusColors[article.status]}
                              variant="outline"
                            >
                              {article.status === 'pending'
                                ? 'Pending Approval'
                                : article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {article.updatedAt && typeof article.updatedAt.toLocaleDateString === 'function'
                                ? article.updatedAt.toLocaleDateString()
                                : <span className="text-red-500">No Date</span>}
                            </div>
                          </div>
                        </div>

                        {/* Keyword Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{article.keyword}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {article.volume ? article.volume.toLocaleString() : 'N/A'} volume
                              </span>
                            </div>
                            <Badge
                              className={
                                difficultyColors[article.keywordDifficulty]
                              }
                              variant="outline"
                            >
                              {article.keywordDifficulty} difficulty
                            </Badge>
                          </div>
                        </div>

                        {/* Assigned To section removed for single-user application */}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {articles.map((article) => (
                    <Card
                      key={article._id}
                      className="group hover:shadow-lg transition-all duration-200 hover:border-[hsl(var(--razor-primary))] hover:shadow-[hsl(var(--razor-primary))]/10"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <Link to={`/articles/${article._id}`}>
                                  <h3 className="font-semibold text-lg hover:text-gray-800 transition-colors cursor-pointer">
                                    {article.title}
                                  </h3>
                                </Link>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  {article.relatedProject ? (
                                    <Link to={`/projects/${article.relatedProject._id}`} className="flex items-center gap-1 group">
                                      <ExternalLink className="h-3 w-3 group-hover:text-gray-800 transition-colors" />
                                      <span className="truncate group-hover:text-gray-800 transition-colors">{article.relatedProject.name}</span>
                                    </Link>
                                  ) : (
                                    <span className="text-red-500">No Project</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge
                                  className={statusColors[article.status]}
                                  variant="outline"
                                >
                                  {article.status === 'pending'
                                    ? 'Pending Approval'
                                    : article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                                </Badge>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  {article.updatedAt && typeof article.updatedAt.toLocaleDateString === 'function'
                                    ? article.updatedAt.toLocaleDateString()
                                    : <span className="text-red-500">No Date</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-sm">
                                  <Target className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {article.keyword}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {typeof article.volume === 'number' && !isNaN(article.volume)
                                      ? article.volume.toLocaleString() + ' volume'
                                      : <span className="text-red-500">No Volume</span>}
                                  </span>
                                </div>
                                <Badge
                                  className={
                                    difficultyColors[article.keywordDifficulty]
                                  }
                                  variant="outline"
                                >
                                  {article.keywordDifficulty} difficulty
                                </Badge>
                              </div>
                              {/* Assigned To section removed for single-user application */}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleCopyLink(article._id)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/articles/${article._id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/articles/${article._id}`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              {canRegenerateTitle(article) && (
                                <DropdownMenuItem
                                  onClick={() => handleRegenerateTitle(article)}
                                >
                                  <Brain className="h-4 w-4 mr-2" />
                                  Regenerate Title
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <Settings className="h-4 w-4 mr-2" />
                                  Change Status
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {getStatusOptions(article).map((option) => (
                                    <DropdownMenuItem
                                      key={option.value}
                                      onClick={() => handleStatusChange(article._id, option.value, article.status)}
                                      disabled={article.status === option.value}
                                    >
                                      {option.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Calendar View */}
              {viewMode === 'calendar' && (
                <div className="bg-white rounded-lg border">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="sm" onClick={() => {
                        if (calendarView === 'month') {
                          setCalendarCurrentDate(new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth() - 1, 1));
                        } else if (calendarView === 'week') {
                          setCalendarCurrentDate(new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth(), calendarCurrentDate.getDate() - 7));
                        } else {
                          setCalendarCurrentDate(new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth(), calendarCurrentDate.getDate() - 1));
                        }
                      }}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setCalendarCurrentDate(new Date())}>
                        Today
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        if (calendarView === 'month') {
                          setCalendarCurrentDate(new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth() + 1, 1));
                        } else if (calendarView === 'week') {
                          setCalendarCurrentDate(new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth(), calendarCurrentDate.getDate() + 7));
                        } else {
                          setCalendarCurrentDate(new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth(), calendarCurrentDate.getDate() + 1));
                        }
                      }}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <h2 className="text-lg font-semibold ml-4">
                        {calendarView === 'month' && calendarCurrentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        {calendarView === 'week' && `Week of ${getWeekStart(calendarCurrentDate).toLocaleDateString()}`}
                        {calendarView === 'day' && calendarCurrentDate.toLocaleDateString()}
                      </h2>
                    </div>
                    {/* <div className="flex border rounded-md">
                      <Button
                        variant={calendarView === 'month' ? 'default' : 'ghost'}
                        size="sm"
                        className="rounded-r-none"
                        onClick={() => setCalendarView('month')}
                      >
                        Month
                      </Button>
                      <Button
                        variant={calendarView === 'week' ? 'default' : 'ghost'}
                        size="sm"
                        className="rounded-none border-x"
                        onClick={() => setCalendarView('week')}
                      >
                        Week
                      </Button>
                      <Button
                        variant={calendarView === 'day' ? 'default' : 'ghost'}
                        size="sm"
                        className="rounded-l-none"
                        onClick={() => setCalendarView('day')}
                      >
                        Day
                      </Button>
                    </div> */}
                  </div>

                  {/* Calendar Grid */}
                  <div className="p-4">
                    {Object.values(calendarStatusData).flat().length === 0 && (
                      <div className="text-center text-muted-foreground mb-4">
                        No articles found for this period and filters.
                      </div>
                    )}
                    <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                      {/* Day Headers */}
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                        (day) => (
                          <div
                            key={day}
                            className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-600"
                          >
                            {day}
                          </div>
                        )
                      )}

                      {/* Calendar Days */}
                      {(() => {
                        // Get the first day of the current month
                        const firstDayOfMonth = new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth(), 1);
                        // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
                        const firstDayOfWeek = firstDayOfMonth.getDay();
                        // Get the last day of the current month
                        const lastDayOfMonth = new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth() + 1, 0);
                        const daysInMonth = lastDayOfMonth.getDate();

                        // Get the last day of the previous month
                        const lastDayOfPrevMonth = new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth(), 0);
                        const daysInPrevMonth = lastDayOfPrevMonth.getDate();

                        // Calculate total cells needed (6 weeks = 42 days)
                        const totalCells = 42;
                        const calendarDays = [];

                        // Add previous month's trailing days
                        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                          const dayNumber = daysInPrevMonth - i;
                          const cellDate = new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth() - 1, dayNumber);
                          calendarDays.push({
                            date: cellDate,
                            dayNumber,
                            isCurrentMonth: false,
                            isPrevMonth: true,
                            isNextMonth: false
                          });
                        }

                        // Add current month's days
                        for (let day = 1; day <= daysInMonth; day++) {
                          const cellDate = new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth(), day);
                          calendarDays.push({
                            date: cellDate,
                            dayNumber: day,
                            isCurrentMonth: true,
                            isPrevMonth: false,
                            isNextMonth: false
                          });
                        }

                        // Add next month's leading days
                        const remainingCells = totalCells - calendarDays.length;
                        for (let day = 1; day <= remainingCells; day++) {
                          const cellDate = new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth() + 1, day);
                          calendarDays.push({
                            date: cellDate,
                            dayNumber: day,
                            isCurrentMonth: false,
                            isPrevMonth: false,
                            isNextMonth: true
                          });
                        }

                        return calendarDays.map((calendarDay, i) => {
                          // Gather all articles for this day, grouped by status
                          const dayArticlesByStatus: Record<string, any[]> = {};
                          Object.entries(calendarStatusData).forEach(([status, articles]) => {
                            dayArticlesByStatus[status] = (articles as any[]).filter((article) => {
                              // Use start_date if available, otherwise fallback to created_at
                              const dateStr = article.start_date || article.created_at;
                              const articleDate = dateStr ? new Date(dateStr) : null;
                              return articleDate &&
                                articleDate.getDate() === calendarDay.dayNumber &&
                                articleDate.getMonth() === calendarDay.date.getMonth() &&
                                articleDate.getFullYear() === calendarDay.date.getFullYear();
                            });
                          });
                          // Flatten for display, but keep status for color
                          const dayArticles = Object.entries(dayArticlesByStatus).flatMap(([status, articles]) =>
                            articles.map(article => ({ ...article, _status: status }))
                          );
                          // Define color order for statuses
                          const statusColorOrder = [
                            'not_started', // gray
                            'in_progress', // blue
                            'internal_review', // yellow
                            'awaiting_feedback', // orange
                            'published', // green
                            'rejected', // red
                          ];
                          // Sort articles by status color order
                          dayArticles.sort((a, b) => {
                            const aIdx = statusColorOrder.indexOf(a._status);
                            const bIdx = statusColorOrder.indexOf(b._status);
                            return aIdx - bIdx;
                          });
                          return (
                            <div
                              key={i}
                              className={`min-h-[120px] p-2 border-r border-b ${calendarDay.isCurrentMonth
                                ? 'bg-white'
                                : 'bg-gray-50'
                                }`}
                            >
                              <div className={`text-sm font-medium mb-2 ${calendarDay.isCurrentMonth
                                ? 'text-gray-900'
                                : 'text-gray-400'
                                }`}>
                                {calendarDay.dayNumber}
                              </div>
                              <div className="space-y-1">
                                {dayArticles.slice(0, 2).map((article) => (
                                  <Tooltip key={article._id}>
                                    <TooltipTrigger asChild>
                                      <Link to={`/articles/${article._id}`}>
                                        <div
                                          className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${statusColors[article._status as ArticleStatus] || statusColors['not started']}`}
                                        >
                                          {article.name}
                                        </div>
                                      </Link>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      className={statusColors[article._status as ArticleStatus] || statusColors['not started']}
                                    >
                                      {article.name}
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                                {dayArticles.length > 2 && (
                                  (() => {
                                    // Unique key for each day cell
                                    const cellKey = `${calendarDay.date.getFullYear()}-${calendarDay.date.getMonth()}-${calendarDay.dayNumber}`;

                                    // Handler for click
                                    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
                                      e.stopPropagation();
                                      setOpenTooltipCell(cellKey);
                                      pinnedTooltipCell.current = cellKey;
                                      // Add event listener to close on outside click
                                      const handleOutside = (event: MouseEvent) => {
                                        const target = event.target as Element | null;
                                        if (!target || !target.closest(`[data-tooltip-cell='${cellKey}']`)) {
                                          setOpenTooltipCell(null);
                                          pinnedTooltipCell.current = null;
                                          document.removeEventListener('mousedown', handleOutside);
                                        }
                                      };
                                      document.addEventListener('mousedown', handleOutside);
                                    };

                                    // Handler for mouse enter
                                    const handleMouseEnter = () => {
                                      setOpenTooltipCell(cellKey);
                                    };

                                    // Handler for mouse leave
                                    const handleMouseLeave = () => {
                                      if (pinnedTooltipCell.current !== cellKey) {
                                        setOpenTooltipCell(null);
                                      }
                                    };

                                    return (
                                      <Tooltip
                                        key={cellKey}
                                        open={openTooltipCell === cellKey}
                                        onOpenChange={(open) => {
                                          if (open) {
                                            setOpenTooltipCell(cellKey);
                                          } else {
                                            setOpenTooltipCell(null);
                                            if (pinnedTooltipCell.current === cellKey) {
                                              pinnedTooltipCell.current = null;
                                            }
                                          }
                                        }}
                                      >
                                        <TooltipTrigger asChild>
                                          <div
                                            className="text-xs text-gray-500 cursor-pointer underline"
                                            data-tooltip-cell={cellKey}
                                            onClick={handleClick}
                                            onMouseEnter={handleMouseEnter}
                                            onMouseLeave={handleMouseLeave}
                                          >
                                            +{dayArticles.length - 2} more
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          className="min-w-[180px] max-h-60 overflow-y-auto"
                                          onMouseEnter={handleMouseEnter}
                                          onMouseLeave={handleMouseLeave}
                                        >
                                          <div className="flex flex-col gap-1">
                                            {dayArticles.slice(2).map((article) => (
                                              <Link
                                                key={article._id}
                                                to={`/articles/${article._id}`}
                                                className={`block px-2 py-1 rounded text-xs truncate hover:opacity-80 transition-colors ${statusColors[article._status as ArticleStatus] || statusColors['not started']}`
                                                }
                                              >
                                                {article.name}
                                              </Link>
                                            ))}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  })()
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {/* Pagination Controls */}
          {totalRecords > 0 && viewMode !== 'calendar' && (
            <Pagination
              currentPage={page}
              totalItems={totalRecords}
              itemsPerPage={pageSize}
              onPageChange={(pageNumber: number) => setPage(pageNumber)}
              onItemsPerPageChange={(newPageSize: number) => {
                setPageSize(newPageSize);
                setPage(1);
              }}
              pageSizeOptions={[12, 24, 36, 60, 120, 240, 0]}
              showPageSizeSelector={true}
              showJumpToPage={true}
              className="mt-8"
            />
          )}
        </main>

        {/* Pending Approval Confirmation Dialog */}
        <AlertDialog open={showPendingConfirmDialog} onOpenChange={setShowPendingConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="mb-2 text-destructive font-semibold">
                  Attention: You are about to change this article status back to{' '}
                  <b>Pending Approval</b>.<br />
                  This action will require a new review and may interrupt
                  your team's workflow.
                </div>
                Are you sure you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowPendingConfirmDialog(false);
                setPendingStatusChange(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (pendingStatusChange) {
                    await updateArticleStatus(pendingStatusChange.articleId, pendingStatusChange.newStatus);
                  }
                  setShowPendingConfirmDialog(false);
                  setPendingStatusChange(null);
                }}
                className="razor-gradient"
              >
                Yes, Change to Pending Approval
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Outline Required Modal */}
        <OutlineRequiredModal
          open={showOutlineDialog}
          onOpenChange={setShowOutlineDialog}
          loading={outlineLoading}
          onGenerate={handleGenerateOutline}
        />

        {/* Secondary Keyword Modal */}
        {currentApprovalArticle && (
          <SecondaryKeywordModal
            open={showAddKeywordModal}
            onOpenChange={setShowAddKeywordModal}
            initialKeywords={(currentApprovalArticle.secondaryKeywords || []).map(kw => typeof kw === 'string' ? kw : kw.keyword)}
            recommendedKeywords={recommendedKeywords}
            topicTitle={currentApprovalArticle.title}
            primaryKeyword={currentApprovalArticle.keyword}
            onApprove={async (updatedKeywords) => {
              try {
                await updateArticle(currentApprovalArticle._id, {
                  secondary_keywords: updatedKeywords,
                });
                // Update local state
                setArticles(prevArticles =>
                  prevArticles.map(article =>
                    article._id === currentApprovalArticle._id
                      ? { ...article, secondaryKeywords: updatedKeywords.map(keyword => ({
                          keyword,
                          volume: null,
                          competition: null,
                          article_type: null
                        })), status: 'not_started' as ArticleStatus }
                      : article
                  )
                );
                toast({
                  title: 'Article approved',
                  description: 'Article has been approved successfully.',
                });
                setCurrentApprovalArticle(null);
              } catch (err: any) {
                toast({
                  title: 'Error',
                  description: err.message || 'Failed to approve article',
                  variant: 'destructive',
                });
              }
            }}
          />
        )}
        {/* Regenerate Title Modal */}
        {regenerateTitleArticle && (
          <RegenerateTitleModal
            open={showRegenerateTitleModal}
            onOpenChange={setShowRegenerateTitleModal}
            topicId={regenerateTitleArticle._id}
            currentTitle={regenerateTitleArticle.title}
            onSaveAndGenerateOutline={handleRegenerateTitleSaveAndRedirect}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Article</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{articleToDelete?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowDeleteDialog(false);
                setArticleToDelete(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
