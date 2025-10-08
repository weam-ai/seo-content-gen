import { useCallback, useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import type { Topic } from '@/lib/types';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Copy,
  RotateCw,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ExternalLink,
  Target,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import {
  getTopics,
  GetTopicsParams,
  updateArticle,
  getArticlesCalendarView,
  GetArticlesCalendarParams,
  getRecommendedKeywords,
} from '@/lib/services/topics.service';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Pagination } from '@/components/ui/simple-pagination';
import projectService from '@/lib/services/project.service';
// Removed multi-user imports for single-user application
import { useDebounce } from '@/hooks/use-debounce';
import FilterUtilityBar from '@/components/topics/FilterUtilityBar';
import RegenerateTitleModal from '@/components/topics/RegenerateTitleModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { OutlineRequiredModal } from '@/components/ui/OutlineRequiredModal';
import SecondaryKeywordModal from './SecondaryKeywordModal';
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

export default function Topics() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  // 1. Change statusFilter to a string for single-select
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>(
    'grid'
  );
  // Removed multi-user filters for single-user application
  const [sortOrder, setSortOrder] = useState<string>('created_at:desc'); // <-- NEW
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalRecords, setTotalRecords] = useState(0);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsPopoverOpen, setProjectsPopoverOpen] = useState(false);
  // Removed multi-user state variables for single-user application
  const [regenerateTitleModalOpen, setRegenerateTitleModalOpen] =
    useState(false);
  const [regenerateTopicId, setRegenerateTopicId] = useState<string | null>(
    null
  );
  const [regenerateCurrentTitle, setRegenerateCurrentTitle] =
    useState<string>('');
  const [showOutlineDialog, setShowOutlineDialog] = useState(false);
  const [outlineDialogTopicId, setOutlineDialogTopicId] = useState<
    string | null
  >(null);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [keywordModalTopic, setKeywordModalTopic] = useState<any>(null);
  const [keywordModalLoading, setKeywordModalLoading] = useState(false);
  const [keywordModalRecommended, setKeywordModalRecommended] = useState<any[]>(
    []
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<{
    _id: string;
    title: string;
  } | null>(null);

  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // 2. Update fetchTopics to send sort as selected value
  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params: GetTopicsParams = {
      sort: sortOrder, // <-- UPDATED
      limit: pageSize,
      page,
      search_by_status:
        statusFilter === 'all' ? 'pending,rejected' : statusFilter,
      status: statusFilter === 'all' ? 'pending,rejected' : statusFilter,
      // Removed multi-user filter parameters for single-user application
      ...(projectFilter !== 'all' && { search_by_project: projectFilter }),
      ...(debouncedSearchQuery.trim() && {
        search: debouncedSearchQuery.trim(),
      }),
    };
    try {
      const res = await getTopics(params);
      setTopics(res.data);
      setTotalRecords(res.pagination.total_records);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch topics');
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch topics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    projectFilter,
    debouncedSearchQuery,
    statusFilter,
    sortOrder, // <-- NEW
  ]);

  // Calendar view state
  const [calendarView] = useState<'month' | 'week' | 'day'>('month');
  const [calendarCurrentDate, setCalendarCurrentDate] = useState<Date>(
    new Date()
  );
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
  const [calendarStartDate, setCalendarStartDate] = useState<Date>(
    getMonthStart(new Date())
  );
  const [calendarEndDate, setCalendarEndDate] = useState<Date>(
    getMonthEnd(new Date())
  );
  const calendarModule: 'topics' | 'articles' = 'topics';
  const [calendarStatusData, setCalendarStatusData] = useState<any>({});

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

  // Fetch topics or calendar data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        if (viewMode === 'calendar') {
          // Simplified calendar params for single-user application
          const calendarParams: GetArticlesCalendarParams & any = {
            module: calendarModule,
            sort: 'created_at:desc',
            status: statusFilter === 'all' ? 'pending,rejected' : statusFilter,
            start_date: calendarStartDate.toISOString().slice(0, 10),
            end_date: calendarEndDate.toISOString().slice(0, 10),
            ...(projectFilter !== 'all' && {
              search_by_project: projectFilter,
            }),
            ...(debouncedSearchQuery.trim() && {
              search: debouncedSearchQuery.trim(),
            }),
          };
          const res = await getArticlesCalendarView(calendarParams);
          setCalendarStatusData(res.data || {});
          // Flatten all statuses into a single array for rendering
          const allTopics = Object.values(res.data || {}).flat();
          setTopics(allTopics);
          setTotalRecords(allTopics.length);
        } else {
          await fetchTopics();
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch topics');
        toast({
          title: 'Error',
          description: err.message || 'Failed to fetch topics',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    viewMode,
    calendarStartDate,
    calendarEndDate,
    calendarView,
    calendarModule,
    page,
    pageSize,
    projectFilter,
    debouncedSearchQuery,
    statusFilter,
  ]);

  // Removed agency filter reset for single-user application

  // Reset page to 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  // Removed member filter reset for single-user application

  // Reset page to 1 when project filter changes
  useEffect(() => {
    setPage(1);
  }, [projectFilter]);

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

  const filteredTopics = topics; // Use topics directly from API since filtering is now server-side

  const statusColors = {
    'pending approval': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    'mark as rejected': 'bg-red-100 text-red-800 border-red-200',
    'mark as approved': 'bg-green-100 text-green-800 border-green-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    not_started: 'bg-green-100 text-green-800 border-green-200',
  };

  const difficultyColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };

  // Helper function to format status display
  const formatStatusDisplay = (status: string) => {
    if (
      status === 'not_started' ||
      status === 'mark as approved' ||
      status === 'approved'
    ) {
      return 'Approved';
    } else if (status === 'rejected' || status === 'mark as rejected') {
      return 'Rejected';
    } else {
      return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  function getStatusColorClass(status: string) {
    switch (status) {
      case 'pending approval':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'not started':
      case 'approved':
      case 'mark as approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
      case 'mark as rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  const handleCopyLink = (topicId: string) => {
    const fullUrl = `${window.location.origin}/topics/${topicId}`;
    navigator.clipboard.writeText(fullUrl);
    toast({
      title: 'Link copied',
      description: 'Topic link has been copied to clipboard.',
    });
  };

  const handleApprove = async (topicId: string) => {
    const topic = topics.find((t) => t._id === topicId);
    if (!topic) return;
    // Check if generated_outline exists and is not empty
    if (
      !topic.generated_outline ||
      String(topic.generated_outline).trim() === ''
    ) {
      setOutlineDialogTopicId(topicId);
      setShowOutlineDialog(true);
      return;
    }
    // Show modal for secondary keywords before approval
    setKeywordModalTopic(topic);
    setShowKeywordModal(true);
    setKeywordModalLoading(true);
    try {
      const rec = await getRecommendedKeywords(topic._id);
      // Filter out already present secondary keywords
      setKeywordModalRecommended(
        rec.filter(
          (k: any) => !(topic.secondaryKeywords || []).includes(k.keyword)
        )
      );
    } catch {
      setKeywordModalRecommended([]);
    } finally {
      setKeywordModalLoading(false);
    }
  };

  const handleReject = async (topicId: string) => {
    try {
      await updateArticle(topicId, { status: 'rejected' });
      setTopics(
        topics.map((topic) =>
          topic._id === topicId
            ? { ...topic, status: 'rejected' as const }
            : topic
        )
      );
      toast({
        title: 'Topic rejected',
        description: 'Topic has been rejected successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to reject topic',
        variant: 'destructive',
      });
    }
  };

  const handleSetPendingApproval = async (topicId: string) => {
    try {
      await updateArticle(topicId, { status: 'pending' });
      setTopics(
        topics.map((topic) =>
          topic._id === topicId
            ? { ...topic, status: 'pending approval' as any }
            : topic
        )
      );
      toast({
        title: 'Topic set to pending approval',
        description: 'Topic has been set to pending approval successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to set topic to pending approval',
        variant: 'destructive',
      });
    }
  };

  const handleRegenerateTitle = async (topicId: string) => {
    const topic = topics.find((t) => t._id === topicId);
    if (!topic) return;
    setRegenerateTopicId(topicId);
    setRegenerateCurrentTitle(topic.title);
    setRegenerateTitleModalOpen(true);
  };

  const handleDelete = async (topicId: string) => {
    const topic = topics.find((t) => t._id === topicId);
    if (topic) {
      setTopicToDelete({
        _id: topicId,
        title: topic.title,
      });
      setDeleteConfirmOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!topicToDelete) return;

    try {
      const response = await api.delete(`/article/${topicToDelete._id}`);

      if (response.data.status) {
        // Remove the topic from the local state
        setTopics(topics.filter((topic) => topic._id !== topicToDelete._id));
        toast({
          title: 'Topic deleted',
          description: 'Topic has been deleted successfully.',
        });
      } else {
        throw new Error(response.data.message || 'Failed to delete topic');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete topic',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirmOpen(false);
      setTopicToDelete(null);
    }
  };

  // 3. Update the status filter dropdown to single-select
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setProjectFilter('all');
    setPage(1);
    toast({
      title: 'Filters Cleared',
      description: 'All filters have been reset and showing all topics',
    });
  };

  // State to track which calendar cell's '+n more' tooltip is open
  const [openTooltipCell, setOpenTooltipCell] = useState<string | null>(null);
  // Ref to track if the tooltip is pinned by click
  const pinnedTooltipCell = useRef<string | null>(null);

  return (
    <TooltipProvider>
      <OutlineRequiredModal
        open={showOutlineDialog}
        onOpenChange={setShowOutlineDialog}
        onGenerate={() => {
          setShowOutlineDialog(false);
          if (outlineDialogTopicId) {
            navigate(
              `/topics/${outlineDialogTopicId}?autoRegenerateOutline=true`
            );
          }
        }}
      />
      <SecondaryKeywordModal
        open={showKeywordModal}
        onOpenChange={setShowKeywordModal}
        initialKeywords={keywordModalTopic?.secondaryKeywords || []}
        recommendedKeywords={keywordModalRecommended}
        loading={keywordModalLoading}
        topicTitle={keywordModalTopic?.title}
        primaryKeyword={keywordModalTopic?.keyword}
        onApprove={async (updatedKeywords) => {
          if (!keywordModalTopic) return;
          try {
            await updateArticle(keywordModalTopic._id, {
              secondary_keywords: updatedKeywords,
            });
            setTopics((prev) =>
              prev.map((t) =>
                t._id === keywordModalTopic._id
                  ? { ...t, secondaryKeywords: updatedKeywords.map(keyword => ({
                      keyword,
                      volume: null,
                      competition: null,
                      article_type: null
                    })) }
                  : t
              )
            );
            await updateArticle(keywordModalTopic._id, {
              status: 'not_started',
            });
            toast({
              title: 'Topic approved',
              description: 'Topic has been approved successfully.',
            });
          } catch (err: any) {
            toast({
              title: 'Error',
              description: err.message || 'Failed to approve topic',
              variant: 'destructive',
            });
          } finally {
            setShowKeywordModal(false);
            setKeywordModalTopic(null);
            setKeywordModalRecommended([]);
          }
        }}
      />
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this topic?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              topic
              {topicToDelete?.title && (
                <span className="font-medium"> "{topicToDelete.title}"</span>
              )}{' '}
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTopicToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="">
        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <PageHeader
            title="Topics"
            description="Manage content topics awaiting approval or review"
          >
            <Button
              className="razor-gradient hover:opacity-90 transition-opacity"
              asChild
            >
              <Link to="/topics/new">
                <Plus className="h-4 w-4 mr-2" />
                New Topic
              </Link>
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
            clearFilters={clearFilters}
            viewMode={viewMode}
            setViewMode={setViewMode}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />

          {/* Topics Views */}
          {loading ? (
            <div className="text-center py-12">
              <div className="subtle-float">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full razor-gradient flex items-center justify-center gentle-glow">
                  <Target className="h-12 w-12 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Loading topics...</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ||
                statusFilter !== 'all' ||
                projectFilter !== 'all'
                  ? 'Please wait while we load the topics'
                  : 'Get started by creating your first topic'}
              </p>
              <Button className="razor-gradient" asChild>
                <Link to="/topics/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Topic
                </Link>
              </Button>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="subtle-float">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full razor-gradient flex items-center justify-center gentle-glow">
                  <Target className="h-12 w-12 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Error loading topics
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ||
                statusFilter !== 'all' ||
                projectFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first topic'}
              </p>
              <Button className="razor-gradient" asChild>
                <Link to="/topics/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Topic
                </Link>
              </Button>
            </div>
          ) : viewMode !== 'calendar' && filteredTopics.length === 0 ? (
            <div className="text-center py-12">
              <div className="subtle-float">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full razor-gradient flex items-center justify-center gentle-glow">
                  <Target className="h-12 w-12 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">No topics found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ||
                statusFilter !== 'all' ||
                projectFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first topic'}
              </p>
              <Button className="razor-gradient" asChild>
                <Link to="/topics/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Topic
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTopics.map((topic) => (
                    <Card
                      key={topic._id}
                      className="group hover:shadow-lg transition-all duration-200 hover:border-[hsl(var(--razor-primary))] hover:shadow-[hsl(var(--razor-primary))]/10"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <Link to={`/topics/${topic._id}`}>
                              <h3 className="font-semibold text-lg hover:text-[hsl(var(--razor-primary))] transition-colors cursor-pointer">
                                {topic.title}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {topic.relatedProject ? (
                                <Link
                                  to={`/projects/${topic.relatedProject._id}`}
                                  className="flex items-center gap-1 group"
                                >
                                  <ExternalLink className="h-3 w-3 group-hover:text-[hsl(var(--razor-primary))] transition-colors" />
                                  <span className="truncate group-hover:text-[hsl(var(--razor-primary))] transition-colors">
                                    {topic.relatedProject.name}
                                  </span>
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
                                onClick={() => handleCopyLink(topic._id)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/topics/${topic._id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/topics/${topic._id}`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRegenerateTitle(topic._id)}
                              >
                                <RotateCw className="h-4 w-4 mr-2" />
                                Regenerate Title
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {topic.status === 'pending approval' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleApprove(topic._id)}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Approved
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleReject(topic._id)}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Mark as Rejected
                                  </DropdownMenuItem>
                                </>
                              )}
                              {((topic.status as any) === 'rejected' ||
                                (topic.status as any) ===
                                  'mark as rejected') && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleApprove(topic._id)}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Approved
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleSetPendingApproval(topic._id)
                                    }
                                    className="text-yellow-600"
                                  >
                                    <Clock className="h-4 w-4 mr-2" />
                                    Mark as Pending Approval
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDelete(topic._id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Status and Keyword */}
                        <div className="flex items-center justify-between">
                          <Badge
                            className={statusColors[topic.status]}
                            variant="outline"
                          >
                            {formatStatusDisplay(topic.status)}
                          </Badge>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {topic.updatedAt &&
                            typeof topic.updatedAt.toLocaleDateString ===
                              'function' ? (
                              topic.updatedAt.toLocaleDateString()
                            ) : (
                              <span className="text-red-500">No Date</span>
                            )}
                          </div>
                        </div>

                        {/* Keyword Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {topic.keyword ? (
                                topic.keyword.toLowerCase()
                              ) : (
                                <span className="text-red-500">No Keyword</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {typeof topic.volume === 'number' &&
                                !isNaN(topic.volume) ? (
                                  topic.volume.toLocaleString() + ' volume'
                                ) : (
                                  <span className="text-red-500">
                                    No Volume
                                  </span>
                                )}
                              </span>
                            </div>
                            <Badge
                              className={
                                difficultyColors[topic.keywordDifficulty]
                              }
                              variant="outline"
                            >
                              {topic.keywordDifficulty
                                ? topic.keywordDifficulty + ' difficulty'
                                : 'No Difficulty'}
                            </Badge>
                          </div>
                        </div>

                        {/* Assignment section removed for single-user application */}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {filteredTopics.map((topic) => (
                    <Card
                      key={topic._id}
                      className="group hover:shadow-lg transition-all duration-200 hover:border-[hsl(var(--razor-primary))] hover:shadow-[hsl(var(--razor-primary))]/10"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <Link to={`/topics/${topic._id}`}>
                                  <h3 className="font-semibold text-lg hover:text-[hsl(var(--razor-primary))] transition-colors cursor-pointer">
                                    {topic.title}
                                  </h3>
                                </Link>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  {topic.relatedProject ? (
                                    <Link
                                      to={`/projects/${topic.relatedProject._id}`}
                                      className="flex items-center gap-1 group"
                                    >
                                      <ExternalLink className="h-3 w-3 group-hover:text-[hsl(var(--razor-primary))] transition-colors" />
                                      <span className="truncate group-hover:text-[hsl(var(--razor-primary))] transition-colors">
                                        {topic.relatedProject.name}
                                      </span>
                                    </Link>
                                  ) : (
                                    <span className="text-red-500">
                                      No Project
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge
                                  className={statusColors[topic.status]}
                                  variant="outline"
                                >
                                  {formatStatusDisplay(topic.status)}
                                </Badge>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  {topic.updatedAt &&
                                  typeof topic.updatedAt.toLocaleDateString ===
                                    'function' ? (
                                    topic.updatedAt.toLocaleDateString()
                                  ) : (
                                    <span className="text-red-500">
                                      No Date
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-sm">
                                  <Target className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {topic.keyword ? (
                                      topic.keyword.toLowerCase()
                                    ) : (
                                      <span className="text-red-500">
                                        No Keyword
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {typeof topic.volume === 'number' &&
                                    !isNaN(topic.volume) ? (
                                      topic.volume.toLocaleString() + ' volume'
                                    ) : (
                                      <span className="text-red-500">
                                        No Volume
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <Badge
                                  className={
                                    difficultyColors[topic.keywordDifficulty]
                                  }
                                  variant="outline"
                                >
                                  {topic.keywordDifficulty
                                    ? topic.keywordDifficulty + ' difficulty'
                                    : 'No Difficulty'}
                                </Badge>
                              </div>
                              {/* Assignment section removed for single-user application */}
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
                                onClick={() => handleCopyLink(topic._id)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/topics/${topic._id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/topics/${topic._id}`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRegenerateTitle(topic._id)}
                              >
                                <RotateCw className="h-4 w-4 mr-2" />
                                Regenerate Title
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {topic.status === 'pending approval' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleApprove(topic._id)}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Approved
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleReject(topic._id)}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Mark as Rejected
                                  </DropdownMenuItem>
                                </>
                              )}
                              {((topic.status as any) === 'rejected' ||
                                (topic.status as any) ===
                                  'mark as rejected') && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleApprove(topic._id)}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Approved
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleSetPendingApproval(topic._id)
                                    }
                                    className="text-yellow-600"
                                  >
                                    <Clock className="h-4 w-4 mr-2" />
                                    Mark as Pending Approval
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDelete(topic._id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (calendarView === 'month') {
                            setCalendarCurrentDate(
                              new Date(
                                calendarCurrentDate.getFullYear(),
                                calendarCurrentDate.getMonth() - 1,
                                1
                              )
                            );
                          } else if (calendarView === 'week') {
                            setCalendarCurrentDate(
                              new Date(
                                calendarCurrentDate.getFullYear(),
                                calendarCurrentDate.getMonth(),
                                calendarCurrentDate.getDate() - 7
                              )
                            );
                          } else {
                            setCalendarCurrentDate(
                              new Date(
                                calendarCurrentDate.getFullYear(),
                                calendarCurrentDate.getMonth(),
                                calendarCurrentDate.getDate() - 1
                              )
                            );
                          }
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCalendarCurrentDate(new Date())}
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (calendarView === 'month') {
                            setCalendarCurrentDate(
                              new Date(
                                calendarCurrentDate.getFullYear(),
                                calendarCurrentDate.getMonth() + 1,
                                1
                              )
                            );
                          } else if (calendarView === 'week') {
                            setCalendarCurrentDate(
                              new Date(
                                calendarCurrentDate.getFullYear(),
                                calendarCurrentDate.getMonth(),
                                calendarCurrentDate.getDate() + 7
                              )
                            );
                          } else {
                            setCalendarCurrentDate(
                              new Date(
                                calendarCurrentDate.getFullYear(),
                                calendarCurrentDate.getMonth(),
                                calendarCurrentDate.getDate() + 1
                              )
                            );
                          }
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <h2 className="text-lg font-semibold ml-4">
                        {calendarView === 'month' &&
                          calendarCurrentDate.toLocaleString('default', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        {calendarView === 'week' &&
                          `Week of ${getWeekStart(
                            calendarCurrentDate
                          ).toLocaleDateString()}`}
                        {calendarView === 'day' &&
                          calendarCurrentDate.toLocaleDateString()}
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
                      {Array.from({ length: 35 }, (_, i) => {
                        const dayNumber = i - 6 + 1; // Adjust for month start
                        const isCurrentMonth = dayNumber > 0 && dayNumber <= 30;
                        // Gather all topics for this day, grouped by status
                        const dayTopicsByStatus: Record<string, any[]> = {};
                        Object.entries(calendarStatusData).forEach(
                          ([status, topics]) => {
                            dayTopicsByStatus[status] = (
                              topics as any[]
                            ).filter((topic) => {
                              const dateStr =
                                topic.start_date || topic.created_at;
                              const topicDate = dateStr
                                ? new Date(dateStr)
                                : null;
                              return (
                                topicDate &&
                                topicDate.getDate() === dayNumber &&
                                topicDate.getMonth() ===
                                  calendarCurrentDate.getMonth() &&
                                topicDate.getFullYear() ===
                                  calendarCurrentDate.getFullYear()
                              );
                            });
                          }
                        );
                        // Flatten for display, but keep status for color
                        const dayTopics = Object.entries(
                          dayTopicsByStatus
                        ).flatMap(([status, topics]) =>
                          topics.map((topic) => ({ ...topic, _status: status }))
                        );
                        // Define color order for statuses
                        const statusColorOrder = [
                          'pending', // yellow
                          'pending approval', // yellow
                          'not_started', // green
                          'not started', // green
                          'approved', // green
                          'mark as approved', // green
                          'rejected', // red
                          'mark as rejected', // red
                        ];
                        // Sort topics by status color order
                        dayTopics.sort((a, b) => {
                          const aIdx = statusColorOrder.indexOf(a._status);
                          const bIdx = statusColorOrder.indexOf(b._status);
                          return aIdx - bIdx;
                        });
                        return (
                          <div
                            key={i}
                            className="bg-white min-h-[120px] p-2 border-r border-b"
                          >
                            {isCurrentMonth && (
                              <>
                                <div className="text-sm font-medium mb-2">
                                  {dayNumber}
                                </div>
                                <div className="space-y-1">
                                  {dayTopics.slice(0, 2).map((topic) => (
                                    <Tooltip key={topic._id}>
                                      <TooltipTrigger asChild>
                                        <Link to={`/topics/${topic._id}`}>
                                          <div
                                            className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${getStatusColorClass(
                                              topic._status || topic.status
                                            )}`}
                                          >
                                            {topic.name || topic.title}
                                            {topic.keyword && (
                                              <span className="ml-1 text-[10px] text-gray-500">
                                                ({topic.keyword.toLowerCase()})
                                              </span>
                                            )}
                                          </div>
                                        </Link>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        className={getStatusColorClass(
                                          topic._status || topic.status
                                        )}
                                      >
                                        {topic.name || topic.title}
                                      </TooltipContent>
                                    </Tooltip>
                                  ))}
                                  {dayTopics.length > 2 &&
                                    (() => {
                                      const cellKey = `${calendarCurrentDate.getFullYear()}-${calendarCurrentDate.getMonth()}-${dayNumber}`;
                                      const handleClick = (
                                        e: React.MouseEvent<HTMLDivElement>
                                      ) => {
                                        e.stopPropagation();
                                        setOpenTooltipCell(cellKey);
                                        pinnedTooltipCell.current = cellKey;
                                        const handleOutside = (
                                          event: MouseEvent
                                        ) => {
                                          const target =
                                            event.target as Element | null;
                                          if (
                                            !target ||
                                            !target.closest(
                                              `[data-tooltip-cell='${cellKey}']`
                                            )
                                          ) {
                                            setOpenTooltipCell(null);
                                            pinnedTooltipCell.current = null;
                                            document.removeEventListener(
                                              'mousedown',
                                              handleOutside
                                            );
                                          }
                                        };
                                        document.addEventListener(
                                          'mousedown',
                                          handleOutside
                                        );
                                      };
                                      const handleMouseEnter = () => {
                                        setOpenTooltipCell(cellKey);
                                      };
                                      const handleMouseLeave = () => {
                                        if (
                                          pinnedTooltipCell.current !== cellKey
                                        ) {
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
                                              if (
                                                pinnedTooltipCell.current ===
                                                cellKey
                                              ) {
                                                pinnedTooltipCell.current =
                                                  null;
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
                                              +{dayTopics.length - 2} more
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent
                                            className="min-w-[180px] max-h-60 overflow-y-auto"
                                            onMouseEnter={handleMouseEnter}
                                            onMouseLeave={handleMouseLeave}
                                          >
                                            <div className="flex flex-col gap-1">
                                              {dayTopics
                                                .slice(2)
                                                .map((topic) => (
                                                  <Link
                                                    key={topic._id}
                                                    to={`/topics/${topic._id}`}
                                                    className={`block px-2 py-1 rounded text-xs truncate hover:opacity-80 transition-colors
                                                ${getStatusColorClass(
                                                  topic._status || topic.status
                                                )}`}
                                                  >
                                                    {topic.name || topic.title}
                                                    {topic.keyword && (
                                                      <span className="ml-1 text-[10px] text-gray-500">
                                                        (
                                                        {topic.keyword.toLowerCase()}
                                                        )
                                                      </span>
                                                    )}
                                                  </Link>
                                                ))}
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      );
                                    })()}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
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
              pageSizeOptions={[12, 24, 36, 60, 120, 240]}
              showPageSizeSelector={true}
              showJumpToPage={true}
              className="mt-8"
            />
          )}
        </main>
        <RegenerateTitleModal
          open={regenerateTitleModalOpen}
          onOpenChange={(open) => {
            setRegenerateTitleModalOpen(open);
            if (!open) setRegenerateTopicId(null);
          }}
          topicId={regenerateTopicId || ''}
          currentTitle={regenerateCurrentTitle}
          onSaveAndGenerateOutline={async (newTitle: string) => {
            if (!regenerateTopicId) return;
            try {
              await updateArticle(regenerateTopicId, { name: newTitle });
              setTopics((prev) =>
                prev.map((t) =>
                  t._id === regenerateTopicId ? { ...t, title: newTitle } : t
                )
              );
              setRegenerateTitleModalOpen(false);
              setRegenerateTopicId(null);
              toast({
                title: 'Title regenerated',
                description:
                  'Topic title updated successfully. Redirecting to topic detail...',
              });
              // Redirect to topic detail page with auto-regenerate outline flag
              navigate(
                `/topics/${regenerateTopicId}?autoRegenerateOutline=true`
              );
            } catch (err: any) {
              toast({
                title: 'Error',
                description: err.message || 'Failed to update title',
                variant: 'destructive',
              });
            }
          }}
        />
      </div>
    </TooltipProvider>
  );
}
