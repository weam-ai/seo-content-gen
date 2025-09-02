import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Calendar, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Article } from '@/lib/types';

interface ArticleCardProps {
  article: Article;
  viewMode?: 'grid' | 'list';
  onDelete?: (article: Article) => void;
}

export function ArticleCard({ article, onDelete }: ArticleCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    not_started: 'bg-gray-100 text-gray-800 border-gray-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    internal_review: 'bg-purple-100 text-purple-800 border-purple-200',
    awaiting_feedback: 'bg-orange-100 text-orange-800 border-orange-200',
    published: 'bg-green-100 text-green-800 border-green-200',
  };
  
  const statusLabels = {
    pending: 'Pending',
    rejected: 'Rejected',
    not_started: 'Not Started',
    in_progress: 'In Progress',
    internal_review: 'Internal Review',
    awaiting_feedback: 'Awaiting Feedback',
    published: 'Published',
  };
  
  const navigate = useNavigate();

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-[hsl(var(--razor-primary))] hover:shadow-[hsl(var(--razor-primary))]/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <Link to={`/articles/${article._id}`}>
              <h3 className="font-semibold text-lg hover:text-[hsl(var(--razor-primary))] transition-colors cursor-pointer">
                {article.title}
              </h3>
            </Link>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/articles/${article._id}`)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/articles/${article._id}/edit`)}>
                Edit
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(article)}
                  className="text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge
            className={`${statusColors[article.status as keyof typeof statusColors] || statusColors.not_started} text-xs capitalize`}
          >
            {statusLabels[article.status as keyof typeof statusLabels] || article.status}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {format(new Date(article.createdAt), 'MMM dd, yyyy')}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Project:</span>
            {article.relatedProject?._id ? (
              <Link
                to={`/projects/${article.relatedProject._id}`}
                className="text-[hsl(var(--razor-primary))] hover:underline truncate"
              >
                {article.relatedProject.name}
              </Link>
            ) : (
              <span className="text-muted-foreground truncate">No project assigned</span>
            )}
          </div>


        </div>

        {article.keyword && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Keywords:</span>
            <span className="truncate text-xs">{article.keyword}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}