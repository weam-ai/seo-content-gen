import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Target,
  Search,
  Calendar,
  Eye,
  Plus,
  Filter,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProjectDetail as ProjectDetailType } from '@/lib/services/project.service';
import type { Article } from '@/lib/types';
import { Pagination } from '@/components/ui/simple-pagination';
import {
  getArticles,
  GetArticlesParams,
} from '@/lib/services/topics.service';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

interface ProjectContentTabProps {
  project: ProjectDetailType;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'pending approval': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  'not started': 'bg-gray-100 text-gray-800 border-gray-200',
  not_started: 'bg-gray-100 text-gray-800 border-gray-200',
  'in progress': 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  'internal review': 'bg-purple-100 text-purple-800 border-purple-200',
  internal_review: 'bg-purple-100 text-purple-800 border-purple-200',
  'awaiting feedback': 'bg-orange-100 text-orange-800 border-orange-200',
  awaiting_feedback: 'bg-orange-100 text-orange-800 border-orange-200',
  published: 'bg-green-100 text-green-800 border-green-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
};

// Function to get the display text for status
const getStatusDisplayText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Pending Approval',
    'pending approval': 'Pending Approval',
    rejected: 'Rejected',
    'not started': 'Not Started',
    not_started: 'Not Started',
    'in progress': 'In Progress',
    in_progress: 'In Progress',
    'internal review': 'Internal Review',
    internal_review: 'Internal Review',
    'awaiting feedback': 'Awaiting Feedback',
    awaiting_feedback: 'Awaiting Feedback',
    published: 'Published',
    approved: 'Approved',
    'mark as approved': 'Mark as Approved',
    'mark as rejected': 'Mark as Rejected',
  };

  return statusMap[status] || status.replace(/[_-]/g, ' ');
};

export default function ProjectContentTab({ project }: ProjectContentTabProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalArticles, setTotalArticles] = useState(0);

  // Filtering and pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { toast } = useToast();
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, debouncedSearchQuery]);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const articleParams: GetArticlesParams = {
          sort: 'created_at:desc',
          limit: itemsPerPage,
          page: currentPage,
          search_by_project: project._id,
          ...(statusFilter !== 'all' && {
            search_by_status: statusFilter,
          }),
          ...(debouncedSearchQuery.trim() && {
            search: debouncedSearchQuery.trim(),
          }),
          status:
            'pending,rejected,not_started,in_progress,internal_review,awaiting_feedback,published',
        };
        const articles = await getArticles<Article>(articleParams);
        setArticles(articles.data);
        setTotalArticles(articles.pagination.total_records);
      } catch (error: any) {
        console.error('Error fetching content:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch articles',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [
    project._id,
    currentPage,
    itemsPerPage,
    statusFilter,
    debouncedSearchQuery,
    toast,
  ]);

  // Since API already handles filtering, we only need client-side search if needed
  // Remove redundant filtering as API already handles status and search
  const currentData = articles;

  // Note: Pagination is handled by API, so we use the full data returned
  const paginatedData = currentData;

  return (
    <div className="space-y-6">

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="internal_review">
                    Internal Review
                  </SelectItem>
                  <SelectItem value="awaiting_feedback">
                    Awaiting Feedback
                  </SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Link to={`/articles/new?project=${project._id}`}>
                <Button className="bg-[hsl(var(--razor-primary))] text-white hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  New Article
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Articles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--razor-primary))] mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  Loading articles...
                </p>
              </div>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No articles found
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first article to get started.'}
              </p>
              <Link to={`/articles/new?project=${project._id}`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Article
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {paginatedData.map((item) => (
                <div
                  key={item._id}
                  className="p-6 hover:bg-muted/30 transition-colors"
                >
                  <ArticleItem article={item as Article} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {paginatedData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalArticles}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newSize) => {
            setItemsPerPage(newSize);
            setCurrentPage(1);
          }}
          showPageSizeSelector={true}
          showJumpToPage={true}
        />
      )}
    </div>
  );
}

// Article Item Component
function ArticleItem({ article }: { article: Article }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground truncate whitespace-normal">
                {article.title}
              </h3>
              <Badge
                className={`text-xs px-2 py-1 ${statusColors[article.status] || statusColors['not started']
                  }`}
              >
                {getStatusDisplayText(article.status)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {article.outline || 'No description available.'}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>Keyword: {article.keyword}</span>
              </div>

              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {article.approved_at ? (
                    <span>
                      Approved at: {article.approved_at.toLocaleDateString()}
                    </span>
                  ) : (
                    <span>
                      Created at: {article.createdAt.toLocaleDateString()}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Link to={`/articles/${article._id}`}>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
        </Link>
      </div>
    </div>
  );
}
