import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Settings } from 'lucide-react';
import type { ProjectDetail as ProjectDetailType } from '@/lib/services/project.service';
import * as marked from 'marked';
import DOMPurify from 'dompurify';

interface ProjectHeaderProps {
  project: ProjectDetailType;
  projectId: string;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  archived: 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function ProjectHeader({
  project,
  projectId,
}: ProjectHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge
              className={`${statusColors['active']} px-3 py-1`}
              variant="outline"
            >
              Active
            </Badge>
          </div>
          {project.description && (
            <div className="text-muted-foreground text-lg max-w-4xl">
              <div
                className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-em:text-muted-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground prose-blockquote:border-l-[hsl(var(--razor-primary))] prose-blockquote:text-muted-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:text-muted-foreground prose-a:text-gray-800 prose-a:no-underline hover:prose-a:underline line-clamp-2"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    marked.parse(
                      typeof project.description === 'string'
                        ? project.description.length > 150
                          ? `${project.description.slice(0, 150)}...`
                          : project.description
                        : ''
                    ) as string // Ensure argument is string, not Promise
                  ),
                }}
              />
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-2 max-w-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Project Progress</span>
              <span className="text-sm text-muted-foreground">
                {project?.progress}%
              </span>
            </div>
            <Progress value={project?.progress} className="h-2" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}/edit`}>
            <Button className="razor-gradient hover:opacity-90 hover-lift">
              <Settings className="h-4 w-4 mr-2" />
              Edit Project
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
