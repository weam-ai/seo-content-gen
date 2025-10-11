import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Calendar, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import * as marked from 'marked';
import DomPurify from 'dompurify';

// Removed AssignMember interface for single-user application

interface KeywordMetric {
  keyword: string;
  keyword_volume: number;
  keyword_difficulty: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Project {
  _id: string;
  name: string;
  website_url: string;
  created_at: string;
  description: string;
  keywords: KeywordMetric[] | null;
  // Removed assign_member field for single-user application
  // Removed agency_name field for single-user application
}

interface ProjectCardProps {
  project: Project;
  onDelete?: (project: Project) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800 border-gray-200',
    active: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    archived: 'bg-orange-100 text-orange-800 border-orange-200',
  };
  const projectStatus = 'active'; // Default status for now
  const navigate = useNavigate();

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-[hsl(var(--razor-primary))] hover:shadow-[hsl(var(--razor-primary))]/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <Link to={`/projects/${project._id}`}>
              <h3 className="font-semibold text-lg hover:text-gray-800 transition-colors cursor-pointer">
                {project.name}
              </h3>
            </Link>
            {project.description && (
              <div className="text-sm text-muted-foreground line-clamp-2">
                <div
                  className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-em:text-muted-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground prose-blockquote:border-l-[hsl(var(--razor-primary))] prose-blockquote:text-muted-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:text-muted-foreground prose-a:text-gray-800 prose-a:no-underline hover:prose-a:underline"
                  dangerouslySetInnerHTML={{
                    __html: DomPurify.sanitize(
                      marked.parse(project.description) as string
                    ),
                  }}
                />
              </div>
            )}
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
                onClick={() => navigate(`/projects/${project._id}/edit`)}
              >
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(project)}
                className="text-destructive"
              >
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={statusColors[projectStatus]} variant="outline">
              {projectStatus.charAt(0).toUpperCase() + projectStatus.slice(1)}
            </Badge>
            {/* Removed agency badge for single-user application */}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {project.created_at && !isNaN(new Date(project.created_at).getTime()) ? format(new Date(project.created_at), 'MMM dd, yyyy') : 'No date'}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Website:</span>
            <a
              href={project.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-800 hover:underline truncate"
            >
              {project.website_url}
            </a>
          </div>


        </div>

        {project.keywords && project.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.keywords.slice(0, 3).map((keywordObj, index) => (
              <Badge key={keywordObj.keyword || index} variant="secondary" className="text-xs">
                {keywordObj.keyword}
              </Badge>
            ))}
            {project.keywords.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{project.keywords.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
