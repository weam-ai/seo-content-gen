import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Target, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { ProjectDetail as ProjectDetailType } from '@/lib/services/project.service';
import ProjectService from '@/lib/services/project.service';

interface ProjectQuickStatsProps {
  project: ProjectDetailType;
}

export default function ProjectQuickStats({ project }: ProjectQuickStatsProps) {
  const [targetedKeywordsCount, setTargetedKeywordsCount] = useState(0);

  useEffect(() => {
    async function fetchTargetedKeywordsCount() {
      if (project?._id) {
        try {
          const response = await ProjectService.getProjectKeywords(project._id);
          if (response.status && response.data) {
            setTargetedKeywordsCount(response.data.length);
          }
        } catch (error) {
          // Fallback to project.keywords if API fails
          setTargetedKeywordsCount(project.keywords?.length || 0);
        }
      }
    }
    fetchTargetedKeywordsCount();
  }, [project?._id, project.keywords]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <Card className="hover-lift">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-800" />
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-semibold">
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover-lift">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Keywords</p>
              <p className="font-semibold">{targetedKeywordsCount} targets</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover-lift">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-gray-800" />
            <div>
              <p className="text-sm text-muted-foreground">Language</p>
              <p className="font-semibold">{project.language?.toUpperCase() || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
