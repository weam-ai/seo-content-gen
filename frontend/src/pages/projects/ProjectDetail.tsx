import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Globe,
  Target,
  FileText,
  Eye,
  CheckCircle,
} from 'lucide-react';
// Users import removed - not used in single-user application
import { Link } from 'react-router-dom';
import ProjectService from '@/lib/services/project.service';
import type { ProjectDetail as ProjectDetailType } from '@/lib/services/project.service';
import ProjectHeader from '@/components/project-details/ProjectHeader';
import ProjectQuickStats from '@/components/project-details/ProjectQuickStats';
import ProjectOverviewTab from '@/components/project-details/tabs/ProjectOverviewTab';
import ProjectKeywordsTab from '@/components/project-details/tabs/ProjectKeywordsTab';
// import ProjectTeamTab from '@/components/project-details/tabs/ProjectTeamTab'; // Removed for single-user app
import ProjectContentTab from '@/components/project-details/tabs/ProjectContentTab';
// ComingSoonTab removed - no longer showing coming soon features
import ProjectSitemapTab from '@/components/project-details/tabs/ProjectSitemapTab';
import ProjectAuditReport from '@/components/project-details/tabs/ProjectAuditReport';

export default function ProjectDetails() {
  const params = useParams();
  const navigate = useNavigate();
  const projectId = params.id as string;
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [project, setProject] = useState<ProjectDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        const response = await ProjectService.getProjectById(projectId);
        if (response.status && response.data) {
          setProject(response.data);
          setError(null);
        } else {
          setError(response.message || 'Project not found.');
          setProject(null);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch project details.');
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link to="/projects">
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className=" flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The project you're looking for doesn't exist.
          </p>
          <Link to="/projects">
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Navigation items inspired by the SEO audit interface
  const navigationItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Eye,
      description: 'Project summary and details',
    },
    {
      id: 'keywords',
      label: 'Keywords',
      icon: Target,
      description: 'SEO keywords and targeting',
    },
    // {
    //   id: 'team',
    //   label: 'Team',
    //   icon: Users,
    //   description: 'Team members and roles',
    // }, // Removed for single-user app
    {
      id: 'content',
      label: 'Content',
      icon: FileText,
      description: 'Content pieces and drafts',
    },
    {
      id: 'audit',
      label: 'Site Audit',
      icon: CheckCircle,
      description: 'Technical SEO analysis',
    },
    {
      id: 'sitemap',
      label: 'Sitemap',
      icon: Globe,
      description: 'Website sitemap analysis',
    },
  ];

  return (
    <div className="">
      {/* Updated: Removed max-width constraint to match dashboard page width */}
      <div className="container mx-auto px-4">
        <div className="flex">
          {/* Sidebar Navigation - Inspired by SEO Audit - UNCHANGED */}
          <div className="min-w-64 w-64 backdrop-blur-sm border-border/40 h-[calc(100vh-73px)] sticky top-[73px] overflow-y-auto">
            <div className="p-4">
              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all hover-lift ${
                      activeTab === item.id
                        ? 'bg-[hsl(var(--razor-primary))] text-white shadow-sm'
                        : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.label}</div>
                      {activeTab !== item.id && (
                        <div className="text-xs opacity-70 truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - UNCHANGED */}
          <main className="flex-1 p-6 ">
            {/* Back Navigation - Now in page content */}
            <div className="mb-6">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            {/* Project Header */}
            <div className="mb-8">
              <ProjectHeader project={project} projectId={project._id} />

              {/* Quick Stats Cards */}
              <ProjectQuickStats project={project} />
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <ProjectOverviewTab project={project} />
            )}

            {/* Tab Keywords */}
            {activeTab === 'keywords' && (
              <ProjectKeywordsTab project={project} />
            )}

            {/* {activeTab === 'team' && <ProjectTeamTab projectId={project._id} />} */} {/* Removed for single-user app */}

            {activeTab === 'content' && <ProjectContentTab project={project} />}

            {/* Coming soon tabs removed for single-user application */}

            {activeTab === 'audit' && (
              <ProjectAuditReport projectId={project._id} />
            )}

            {activeTab === 'sitemap' && project && (
              <ProjectSitemapTab
                projectId={project._id}
                projectName={project.name}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
