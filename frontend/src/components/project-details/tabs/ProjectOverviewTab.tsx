import { useState } from 'react';
// useEffect removed - not used in single-user application
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Badge import removed - not used in single-user application
// Avatar components removed - not used in single-user application
import { Button } from '@/components/ui/button';
import {
  Globe,
  MapPin,
  Users,
  Building2,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
// Plus icon removed - not used in single-user application
import type { ProjectDetail as ProjectDetailType } from '@/lib/services/project.service';
import * as marked from 'marked';
// import ManageTeamAssignmentModal from '../ManageTeamAssignmentModal'; // Removed for single-user app
// import UserService, { TeamMember } from '@/lib/services/user.service'; // Removed for single-user app
// import ProjectService from '@/lib/services/project.service'; // Removed for single-user app
import DOMPurify from 'dompurify';

interface OverviewTabProps {
  project: ProjectDetailType;
}

export default function ProjectOverviewTab({ project }: OverviewTabProps) {
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isGuidelinesExpanded, setIsGuidelinesExpanded] = useState(false);
  // const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]); // Removed for single-user app
  // const [assignedIds, setAssignedIds] = useState<string[]>( // Removed for single-user app
  //   project.assign_to?.map((m) => m.id) || []
  // );
  // const [loading, setLoading] = useState(false); // Removed for single-user app
  // Expand/collapse state for each Organization Insights field
  const [expanded, setExpanded] = useState({
    archetype: false,
    spokesperson: false,
    mostImportant: false,
    differentiator: false,
    authorBio: false,
  });
  const toggleExpand = (field: keyof typeof expanded) =>
    setExpanded((prev) => ({ ...prev, [field]: !prev[field] }));

  // useEffect(() => { // Removed for single-user app
  //   async function fetchTeam() {
  //     try {
  //       const res = await UserService.getTeamMembers();
  //       if (res.status) setTeamMembers(res.data);
  //     } catch {}
  //   }
  //   fetchTeam();
  // }, []);

  // const handleAssignChange = async (newAssigned: string[]) => { // Removed for single-user app
  //   setLoading(true);
  //   try {
  //     const added = newAssigned.filter((id) => !assignedIds.includes(id));
  //     const removed = assignedIds.filter((id) => !newAssigned.includes(id));
  //     for (const memberId of added) {
  //       await ProjectService.assignProjectMember(project.id, memberId);
  //     }
  //     for (const memberId of removed) {
  //       await ProjectService.unassignProjectMember(project.id, memberId);
  //     }
  //     setAssignedIds(newAssigned);
  //   } catch {}
  //   setLoading(false);
  // };

  return (
    <div className="space-y-6">
      {/* Project Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-gray-800" />
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Globe className="h-5 w-5 text-gray-800" />
                  <div>
                    <p className="text-sm font-semibold mb-1">Website</p>
                    <a
                      href={project.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-800 hover:underline flex items-center gap-1 text-sm"
                    >
                      {project.website_url.replace('https://', '')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <MapPin className="h-5 w-6 text-gray-800" />
                  <div>
                    <p className="text-sm font-semibold mb-1">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {Array.isArray(project.location)
                        ? project.location.join(', ')
                        : project.location}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-5 w-5 text-gray-800" />
                  <p className="text-sm font-semibold">
                    Industry Guideline Type
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {project.guideline?.name || 'Default Guideline'}
                </p>
              </div>

              {/* Project-Specific Guidelines */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="h-5 w-5 text-gray-800" />
                  <p className="text-sm font-semibold">
                    Project-Specific Guidelines
                  </p>
                </div>
                {project.guideline_description ? (
                  <div className="text-muted-foreground leading-relaxed">
                    <div
                      className={`prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-em:text-muted-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground prose-blockquote:border-l-[hsl(var(--razor-primary))] prose-blockquote:text-muted-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:text-muted-foreground prose-a:text-gray-800 prose-a:no-underline hover:prose-a:underline ${
                        !isGuidelinesExpanded ? 'line-clamp-3' : ''
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(
                          marked.parse(
                            isGuidelinesExpanded
                              ? project.guideline_description
                              : `${project.guideline_description.slice(
                                  0,
                                  300
                                )}${
                                  project.guideline_description.length > 300
                                    ? '...'
                                    : ''
                                }`
                          ) as string
                        ),
                      }}
                    />
                    {project.guideline_description.length > 300 && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() =>
                          setIsGuidelinesExpanded(!isGuidelinesExpanded)
                        }
                        className="px-0 h-auto text-gray-800 mt-2"
                      >
                        {isGuidelinesExpanded ? 'Read Less' : 'Read More'}
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No project-specific guidelines available.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Business Overview */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-800" />
                Business Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-gray-800" />
                    <p className="text-sm font-semibold">Target Audience</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.targeted_audience}
                  </p>
                </div>
                {/* Author Bio */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-gray-800" />
                    <span className="text-sm font-semibold">Author Bio</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.author_bio
                      ? project.author_bio.length > 250 && !expanded.authorBio
                        ? `${project.author_bio.slice(0, 250)}...`
                        : project.author_bio
                      : '—'}
                  </p>
                  {project.author_bio && project.author_bio.length > 250 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => toggleExpand('authorBio')}
                      className="px-0 h-auto text-gray-800 mt-2"
                    >
                      {expanded.authorBio ? 'Read Less' : 'Read More'}
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-gray-800" />
                    <p className="text-sm font-semibold">Business Summary</p>
                  </div>
                  {project.description ? (
                    <div className="text-muted-foreground leading-relaxed">
                      <div
                        className={`prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-em:text-muted-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground prose-blockquote:border-l-[hsl(var(--razor-primary))] prose-blockquote:text-muted-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:text-muted-foreground prose-a:text-gray-800 prose-a:no-underline hover:prose-a:underline ${
                          !isSummaryExpanded ? 'line-clamp-3' : ''
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(
                            marked.parse(
                              isSummaryExpanded
                                ? project.description
                                : `${project.description.slice(0, 250)}...`
                            ) as string // Ensure argument is string, not Promise
                          ),
                        }}
                      />
                      {project.description.length > 250 && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() =>
                            setIsSummaryExpanded(!isSummaryExpanded)
                          }
                          className="px-0 h-auto text-gray-800 mt-2"
                        >
                          {isSummaryExpanded ? 'Read Less' : 'Read More'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No description available.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Organization Insights */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-800" />
                Organization Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Archetype */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-gray-800" />
                    <span className="text-sm font-semibold">Archetype</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.organization_archetype
                      ? project.organization_archetype.length > 250 &&
                        !expanded.archetype
                        ? `${project.organization_archetype.slice(0, 250)}...`
                        : project.organization_archetype
                      : '—'}
                  </p>
                  {project.organization_archetype &&
                    project.organization_archetype.length > 250 && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => toggleExpand('archetype')}
                        className="px-0 h-auto text-gray-800 mt-2"
                      >
                        {expanded.archetype ? 'Read Less' : 'Read More'}
                      </Button>
                    )}
                </div>
                {/* Brand Spokesperson */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-gray-800" />
                    <span className="text-sm font-semibold">
                      Brand Spokesperson
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.brand_spokesperson
                      ? project.brand_spokesperson.length > 250 &&
                        !expanded.spokesperson
                        ? `${project.brand_spokesperson.slice(0, 250)}...`
                        : project.brand_spokesperson
                      : '—'}
                  </p>
                  {project.brand_spokesperson &&
                    project.brand_spokesperson.length > 250 && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => toggleExpand('spokesperson')}
                        className="px-0 h-auto text-gray-800 mt-2"
                      >
                        {expanded.spokesperson ? 'Read Less' : 'Read More'}
                      </Button>
                    )}
                </div>
                {/* Most Important Thing */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-gray-800" />
                    <span className="text-sm font-semibold">
                      Most Important Thing
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.most_important_thing
                      ? project.most_important_thing.length > 250 &&
                        !expanded.mostImportant
                        ? `${project.most_important_thing.slice(0, 250)}...`
                        : project.most_important_thing
                      : '—'}
                  </p>
                  {project.most_important_thing &&
                    project.most_important_thing.length > 250 && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => toggleExpand('mostImportant')}
                        className="px-0 h-auto text-gray-800 mt-2"
                      >
                        {expanded.mostImportant ? 'Read Less' : 'Read More'}
                      </Button>
                    )}
                </div>
                {/* Unique Differentiator */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-gray-800" />
                    <span className="text-sm font-semibold">
                      Unique Differentiator
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.unique_differentiator
                      ? project.unique_differentiator.length > 250 &&
                        !expanded.differentiator
                        ? `${project.unique_differentiator.slice(0, 250)}...`
                        : project.unique_differentiator
                      : '—'}
                  </p>
                  {project.unique_differentiator &&
                    project.unique_differentiator.length > 250 && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => toggleExpand('differentiator')}
                        className="px-0 h-auto text-gray-800 mt-2"
                      >
                        {expanded.differentiator ? 'Read Less' : 'Read More'}
                      </Button>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team section removed for single-user app */}

          {/* Competitors */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gray-800" />
                Competitors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {project.competitors_websites?.map((competitor, index) => (
                <div
                  key={`competitor-${competitor}-${index}`}
                  className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <span className="text-sm truncate flex-1">
                    {competitor.replace('https://', '')}
                  </span>
                  <a
                    href={competitor}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-800 hover:text-gray-800/80 ml-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
