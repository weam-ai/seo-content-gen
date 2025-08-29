import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart3,
  Eye,
  FileText,
  Settings,
  Target,
  Link as LucideLink,
  ExternalLink,
  List,
  Copy,
  AlignJustify,
  AlertTriangle,
  XCircle,
  Ruler,
  Link2Off,
} from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  requestAudit,
  getAuditProgress,
  getAuditReport,
} from '@/lib/services/audit.service';
import * as XLSX from 'xlsx';

interface AuditProgress {
  status: string;
  current_step: string;
  progress_steps: string[];
  error_message: string | null;
}

const ProjectAuditReport = ({ projectId }: { projectId: string }) => {
  // --- State for audit integration ---
  const [progress, setProgress] = useState<AuditProgress | string | null>(null);
  const [auditData, setAuditData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('section-summary');
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const navigationRef = useRef<HTMLDivElement>(null);
  const navButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // --- Progress Steps Animation State (must be top-level!) ---
  const [fade, setFade] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevStepRef = useRef<string | null>(null);
  const [progressSteps, setProgressSteps] = useState<string[]>([]);
  const [currentProgressStep, setCurrentProgressStep] = useState('');

  // Update steps and currentStep when progress changes
  useEffect(() => {
    if (progress && typeof progress === 'object') {
      setProgressSteps(progress.progress_steps || []);
      setCurrentProgressStep(progress.current_step || '');
    } else {
      setProgressSteps([]);
      setCurrentProgressStep('');
    }
  }, [progress]);

  // Animation effect for fade and scroll
  useEffect(() => {
    if (prevStepRef.current !== currentProgressStep) {
      setFade(false);
      setTimeout(() => {
        // Scroll to current step
        if (scrollRef.current) {
          const el = scrollRef.current.querySelector('[data-current-step]');
          if (el && el instanceof HTMLElement) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        setFade(true);
      }, 250);
      prevStepRef.current = currentProgressStep;
    }
  }, [currentProgressStep]);

  async function pollForProgress(projectId: string) {
    setLoading(true);
    let done = false;
    while (!done) {
      await new Promise((r) => setTimeout(r, 10000));
      const progRes = await getAuditProgress(projectId);
      const progressData = progRes.data.data;
      setProgress(progressData); // progress is in data

      // Check if completed or failed
      if (
        typeof progressData === 'object' &&
        progressData.status === 'completed'
      ) {
        done = true;
      } else if (
        typeof progressData === 'string' &&
        progressData === 'completed'
      ) {
        done = true;
      } else if (
        typeof progressData === 'object' &&
        progressData.status === 'failed'
      ) {
        throw new Error(progressData.error_message || 'Audit failed');
      }
    }
    if (!done) throw new Error('Audit timed out.');
    // 3. Fetch audit report
    const reportRes = await getAuditReport(projectId);
    setAuditData(reportRes.data.data);
    setLoading(false);
  }

  // --- Trigger audit and poll for result ---
  const startAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress(null);
    setAuditData(null);
    try {
      await requestAudit(projectId);
      pollForProgress(projectId);
    } catch {}
  }, [projectId]);

  // Initial load: fetch saved report or check progress
  useEffect(() => {
    if (projectId) {
      (async function () {
        const report = await getAuditProgress(projectId);
        const progressData = report.data.data;

        // Check if audit is still in progress
        if (
          typeof progressData === 'object' &&
          progressData.status &&
          !['completed', 'failed'].includes(progressData.status)
        ) {
          setProgress(progressData);
          pollForProgress(projectId);
        } else if (
          typeof progressData === 'string' &&
          !['completed', 'failed'].includes(progressData)
        ) {
          setProgress(progressData);
          pollForProgress(projectId);
        } else {
          setLoading(true);
          setError(null);
          setProgress(null);
          setAuditData(null);

          if (
            (typeof progressData === 'object' &&
              progressData.status === 'failed') ||
            progressData === 'failed'
          ) {
            setError(
              typeof progressData === 'object'
                ? progressData.error_message || 'Audit failed'
                : 'Audit failed'
            );
            setLoading(false);
          } else {
            const result = await getAuditReport(projectId);
            if (result.data && result.data.data) {
              setAuditData(result.data.data);
            }
            setLoading(false);
          }
        }
      })();
    }
  }, [projectId]);

  // Intersection Observer for active section detection
  useEffect(() => {
    const sectionIds = [
      'section-summary',
      'section-recommendations',
      'section-meta-tags',
      'section-headings',
      'section-content-analysis',
      'section-technical-seo',
      'section-images',
      'section-links',
      'section-broken-links',
      'section-analytics',
      'section-schema-markup',
      'section-pagespeed-insights',
      'section-redirect-chain',
      'section-404-page-check',
      'section-https-security',
      'section-sitemap',
      'section-www-resolve',
      'section-inner-pages-meta-audit',
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            sectionRefs.current[entry.target.id] = entry.target as HTMLElement;
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -20% 0px',
        threshold: 0.3,
      }
    );

    // Observe all sections
    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [auditData]); // Re-run when audit data loads

  // Auto-scroll active navigation item into view
  useEffect(() => {
    const activeNavButton = navButtonRefs.current[activeSection];
    if (activeNavButton && navigationRef.current) {
      activeNavButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [activeSection]);

  // Helper function to create navigation buttons
  const createNavButton = (
    id: string,
    icon: React.ReactNode,
    label: string,
    iconColor = '',
    borderColor = ''
  ) => (
    <button
      key={id}
      ref={(el) => (navButtonRefs.current[id] = el)}
      onClick={() => scrollToSection(id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all ${
        activeSection === id
          ? 'bg-[hsl(var(--razor-primary))] text-white shadow-sm'
          : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
      }`}
    >
      <div
        className={`w-5 h-5 rounded flex items-center justify-center ${
          activeSection === id
            ? 'bg-white/20'
            : `border ${borderColor || 'border-muted-foreground/30'}`
        }`}
      >
        <span className={`${activeSection === id ? '' : iconColor}`}>
          {icon}
        </span>
      </div>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  // Helper for scrolling
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  // --- UI rendering helpers ---
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 w-full">
          {/* Loading Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-[hsl(var(--razor-primary))] rounded-full flex items-center justify-center animate-pulse">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Loading Text */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">Running SEO Audit...</h3>
            <p className="text-muted-foreground text-sm">
              Analyzing your website for SEO opportunities and technical issues
            </p>
          </div>

          {/* Current Step */}
          {currentProgressStep && (
            <Card className="mb-4 w-full max-w-md">
              <CardContent className="p-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-[hsl(var(--razor-primary))] rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Current Step:</span>
                <span className="text-sm text-muted-foreground">
                  {currentProgressStep}
                </span>
              </CardContent>
            </Card>
          )}

          {/* Progress Steps - always visible, scrollable, no border */}
          {progressSteps.length > 0 && (
            <div
              ref={scrollRef}
              className={`w-full max-w-md transition-opacity duration-300 ${
                fade ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {progressSteps.map((step, idx) => {
                const isCompleted =
                  idx < progressSteps.indexOf(currentProgressStep);
                const isCurrent = step === currentProgressStep;
                return (
                  <div
                    key={idx}
                    className={`mb-3 p-4 rounded-lg shadow-sm flex items-center gap-3 bg-white/90 ${
                      isCurrent
                        ? 'ring-2 ring-[hsl(var(--razor-primary))] ring-offset-2'
                        : ''
                    }`}
                    data-current-step={isCurrent ? true : undefined}
                  >
                    {/* Icon logic */}
                    {isCompleted ? (
                      <span className="w-5 h-5 flex items-center justify-center text-green-600 animate-fade-in">
                        <svg
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 20 20"
                        >
                          <path
                            d="M5 10.5l4 4 6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    ) : isCurrent ? (
                      <span className="w-5 h-5 flex items-center justify-center">
                        <span className="w-4 h-4 border-2 border-[hsl(var(--razor-primary))] border-t-transparent rounded-full animate-spin scale-110"></span>
                      </span>
                    ) : (
                      <span className="w-4 h-4 bg-gray-200 rounded-full opacity-70 animate-fade-in"></span>
                    )}
                    <span
                      className={`text-sm ${
                        isCompleted
                          ? 'text-green-700'
                          : isCurrent
                          ? 'text-[hsl(var(--razor-primary))] font-semibold'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
              {/* Invisible box for consistent height */}
              <div className="h-10 invisible select-none pointer-events-none" />
            </div>
          )}

          {/* Error Message */}
          {progress &&
            typeof progress === 'object' &&
            progress.error_message && (
              <Card className="border-red-200 mb-4 w-full max-w-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                    <span className="text-sm font-medium text-red-900">
                      Error
                    </span>
                  </div>
                  <p className="text-sm text-red-700">
                    {progress.error_message}
                  </p>
                </CardContent>
              </Card>
            )}

          {/* Estimated Time */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              This usually takes 2-5 minutes depending on your website size
            </p>
          </div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">!</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Audit Failed</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={startAudit} variant="destructive">
                Retry Audit
              </Button>
            </div>
          </div>
        </div>
      );
    }
    if (!auditData) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="w-16 h-16 bg-[hsl(var(--razor-primary))] rounded-full flex items-center justify-center mx-auto">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>

            {/* Content */}
            <div>
              <h3 className="text-lg font-semibold mb-2">No audit data yet.</h3>
              <p className="text-muted-foreground mb-6 text-center">
                Get a comprehensive SEO analysis of your website including
                technical issues, content optimization opportunities, and
                actionable recommendations.
              </p>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Target className="w-6 h-6 text-[hsl(var(--razor-primary))] mx-auto mb-2" />
                    <h4 className="font-medium text-sm mb-1">Technical SEO</h4>
                    <p className="text-xs text-muted-foreground">
                      Meta tags, headers, structure
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Eye className="w-6 h-6 text-[hsl(var(--razor-primary))] mx-auto mb-2" />
                    <h4 className="font-medium text-sm mb-1">
                      Content Analysis
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Keywords, readability, optimization
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Settings className="w-6 h-6 text-[hsl(var(--razor-primary))] mx-auto mb-2" />
                    <h4 className="font-medium text-sm mb-1">Performance</h4>
                    <p className="text-xs text-muted-foreground">
                      Speed, accessibility, best practices
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Button onClick={startAudit} className="w-full md:w-auto">
                <BarChart3 className="w-4 h-4 mr-2" />
                Run SEO Audit
              </Button>
            </div>

            {/* Additional Info */}
            <p className="text-xs text-muted-foreground">
              Free comprehensive analysis • Results in 2-5 minutes
            </p>
          </div>
        </div>
      );
    }
    // --- Render the audit report using auditData ---
    return (
      <div className="space-y-6 w-full min-w-0">
        {/* Summary Section */}
        <div id="section-summary">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Summary</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Site:</span>
                  <a
                    href={auditData.url || auditData.canonical_url}
                    className="text-[hsl(var(--razor-primary))] hover:underline text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {auditData.url || auditData.canonical_url}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Canonical URL:</span>
                  <span className="text-sm text-muted-foreground">
                    {auditData.canonical_url || '-'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                    Completed
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations Section */}
        <div id="section-recommendations">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-semibold">Recommendations</h3>
              </div>
              <div className="space-y-3">
                {(auditData.recommendations || []).map(
                  (rec: string, i: number) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 ${
                        rec.includes('[WARNING]')
                          ? 'bg-yellow-50 border border-yellow-200'
                          : 'bg-green-50 border border-green-200'
                      } rounded-lg`}
                    >
                      <Badge
                        className={
                          rec.includes('[WARNING]')
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200 text-xs'
                            : 'bg-green-100 text-green-800 border-green-200 text-xs'
                        }
                      >
                        {rec.includes('[WARNING]')
                          ? 'Warning'
                          : rec.includes('[PASS]')
                          ? 'Pass'
                          : 'Info'}
                      </Badge>
                      <span className="text-sm">
                        {rec.replace(/^\[.*?\]\s*/, '')}
                      </span>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meta Tags Section */}
        <div id="section-meta-tags">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                <h3 className="text-lg font-semibold">Meta Tags</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium">Title: </span>
                  <span className="text-sm">
                    {auditData.analysis?.meta_tags?.title || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Title Length: </span>
                  <span className="text-sm">
                    {auditData.analysis?.meta_tags?.title_length ?? '-'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">
                    Meta Description:{' '}
                  </span>
                  <span className="text-sm">
                    {auditData.analysis?.meta_tags?.meta_description || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">
                    Description Length:{' '}
                  </span>
                  <span className="text-sm">
                    {auditData.analysis?.meta_tags?.meta_description_length ??
                      '-'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Has Viewport:</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                    {auditData.analysis?.meta_tags?.has_viewport
                      ? 'Pass'
                      : 'Fail'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Has Robots Meta Tag:
                  </span>
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                    {auditData.analysis?.meta_tags?.has_robots
                      ? 'Pass'
                      : 'Fail'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Has Canonical Tag:
                  </span>
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                    {auditData.analysis?.meta_tags?.has_canonical
                      ? 'Pass'
                      : 'Fail'}
                  </Badge>
                </div>
                {auditData.analysis?.meta_tags?.robots_content && (
                  <div>
                    <span className="text-sm font-medium mb-2 block">
                      Robots Content:
                    </span>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {auditData.analysis?.meta_tags?.robots_content}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Headings Section */}
        <div id="section-headings">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                <h3 className="text-lg font-semibold">Headings</h3>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((level) => (
                    <Badge
                      key={level}
                      variant="outline"
                      className={
                        (auditData.analysis?.headings?.[level]?.length || 0) > 0
                          ? 'border-[hsl(var(--razor-primary))] text-[hsl(var(--razor-primary))]'
                          : 'border-gray-300 text-gray-500'
                      }
                    >
                      {level.toUpperCase()} (
                      {auditData.analysis?.headings?.[level]?.length || 0})
                    </Badge>
                  ))}
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Level</th>
                        <th className="text-left p-3 font-medium">Text</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].flatMap((level) =>
                        (auditData.analysis?.headings?.[level] || []).map(
                          (text: string, i: number) => (
                            <tr key={level + i}>
                              <td className="p-3 font-medium">
                                {level.toUpperCase()}
                              </td>
                              <td className="p-3 text-sm">{text}</td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Analysis Section */}
        <div id="section-content-analysis">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                <h3 className="text-lg font-semibold">Content Analysis</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium">Word Count: </span>
                  <span className="text-sm">
                    {auditData.analysis?.content?.word_count ?? '-'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium mb-3 block">
                    Top Keywords:
                  </span>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Keyword</th>
                          <th className="text-left p-3 font-medium">Count</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(auditData.analysis?.content?.top_keywords || []).map(
                          (kw: any, i: number) => (
                            <tr key={i}>
                              <td className="p-3 text-sm">{kw[0]}</td>
                              <td className="p-3 text-sm">{kw[1]}</td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical SEO Section */}
        <div id="section-technical-seo">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                <h3 className="text-lg font-semibold">Technical SEO</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Key technical factors that affect how search engines crawl and
                index your site.
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Robots.txt Present
                      </span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                      {auditData.analysis?.robots?.exists ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Crawlable by Search Engines
                      </span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                      {auditData.analysis?.robots?.blocks_search_engines
                        ? 'Fail'
                        : 'Pass'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Blocked by robots.txt
                      </span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                      {auditData.analysis?.accessibility?.blocked_by_robots_txt
                        ? 'Yes'
                        : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Blocked by Meta Robots Tag
                      </span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                      {auditData.analysis?.accessibility?.blocked_by_meta_robots
                        ? 'Yes'
                        : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Blocked by X-Robots-Tag Header
                      </span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                      {auditData.analysis?.accessibility
                        ?.blocked_by_x_robots_header
                        ? 'Yes'
                        : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Blocked Search Engines
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {(
                        auditData.analysis?.accessibility?.blocked_engines || []
                      ).join(', ') || 'None'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Allowed Search Engines
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {(
                        auditData.analysis?.accessibility?.allowed_engines || []
                      ).join(', ') || 'None'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">
                    robots.txt File Content:
                  </span>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-64 overflow-y-auto">
                    {(auditData.analysis?.robots?.content || '')
                      .split('\n')
                      .map((line: string, i: number) => (
                        <div key={i} className="whitespace-nowrap">
                          {line}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Images Section */}
        <div id="section-images">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-pink-500" />
                <h3 className="text-lg font-semibold">Images</h3>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Badge
                    variant="outline"
                    className="border-[hsl(var(--razor-primary))] text-[hsl(var(--razor-primary))]"
                  >
                    Total Images: {(auditData.analysis?.images || []).length}
                  </Badge>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    With Alt Text:{' '}
                    {
                      (auditData.analysis?.images || []).filter(
                        (img: any) => img.has_alt
                      ).length
                    }
                  </Badge>
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    Without Alt Text:{' '}
                    {
                      (auditData.analysis?.images || []).filter(
                        (img: any) => !img.has_alt
                      ).length
                    }
                  </Badge>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Src</th>
                          <th className="text-left p-3 font-medium">
                            Alt Text
                          </th>
                          <th className="text-left p-3 font-medium">
                            Alt Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(auditData.analysis?.images || []).map(
                          (img: any, i: number) => (
                            <tr key={i}>
                              <td className="p-3 text-xs break-all max-w-xs">
                                {img.src}
                              </td>
                              <td
                                className={`p-3 text-sm break-words ${
                                  img.has_alt ? '' : 'text-muted-foreground'
                                }`}
                              >
                                {img.alt || 'None'}
                              </td>
                              <td className="p-3">
                                <Badge
                                  className={
                                    img.has_alt
                                      ? 'bg-green-100 text-green-800 border-green-200 text-xs'
                                      : 'bg-red-100 text-red-800 border-red-200 text-xs'
                                  }
                                >
                                  {img.has_alt ? 'Pass' : 'Fail'}
                                </Badge>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Links Section */}
        <div id="section-links">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Links</h3>
              </div>
              <div className="flex flex-col gap-6">
                {/* Internal Links */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <LucideLink className="h-4 text-[hsl(var(--razor-primary))]" />
                    <span className="font-medium text-sm">Internal Links</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {(auditData.analysis?.links?.internal_links || []).length}
                    </Badge>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">URL</th>
                            <th className="text-left p-3 font-medium">
                              Nofollow
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(auditData.analysis?.links?.internal_links || [])
                            .length === 0 ? (
                            <tr>
                              <td
                                colSpan={2}
                                className="p-3 text-xs text-muted-foreground text-center"
                              >
                                No internal links found.
                              </td>
                            </tr>
                          ) : (
                            (
                              auditData.analysis?.links?.internal_links || []
                            ).map((link: any, i: number) => (
                              <tr key={i}>
                                <td className="p-3 text-sm break-all">
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-700 hover:underline"
                                    title={link.url}
                                  >
                                    {link.url}
                                  </a>
                                </td>
                                <td className="p-3 text-sm">
                                  <Badge
                                    variant="outline"
                                    className={
                                      link.nofollow
                                        ? 'border-yellow-300 text-yellow-700 bg-yellow-50 text-xs'
                                        : 'text-xs'
                                    }
                                  >
                                    {link.nofollow ? 'Yes' : 'No'}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {/* External Links */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-sm">External Links</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {(auditData.analysis?.links?.external_links || []).length}
                    </Badge>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">URL</th>
                            <th className="text-left p-3 font-medium">
                              Nofollow
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(auditData.analysis?.links?.external_links || [])
                            .length === 0 ? (
                            <tr>
                              <td
                                colSpan={2}
                                className="p-3 text-xs text-muted-foreground text-center"
                              >
                                No external links found.
                              </td>
                            </tr>
                          ) : (
                            (
                              auditData.analysis?.links?.external_links || []
                            ).map((link: any, i: number) => (
                              <tr key={i}>
                                <td className="p-3 text-sm break-all">
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-700 hover:underline"
                                    title={link.url}
                                  >
                                    {link.url}
                                  </a>
                                </td>
                                <td className="p-3 text-sm">
                                  <Badge
                                    variant="outline"
                                    className={
                                      link.nofollow
                                        ? 'border-yellow-300 text-yellow-700 bg-yellow-50 text-xs'
                                        : 'text-xs'
                                    }
                                  >
                                    {link.nofollow ? 'Yes' : 'No'}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Broken Links Section */}
        <div id="section-broken-links">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold">Broken Links</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Broken Links Found:
                  </span>
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                    {(auditData.analysis?.links?.broken_links || []).length > 0
                      ? `${
                          (auditData.analysis?.links?.broken_links || []).length
                        } Found`
                      : 'None Found'}
                  </Badge>
                </div>
                {(auditData.analysis?.links?.broken_links || []).length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">URL</th>
                            <th className="text-left p-3 font-medium">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(auditData.analysis?.links?.broken_links || []).map(
                            (link: any, i: number) => (
                              <tr key={i}>
                                <td className="p-3 text-sm break-all">
                                  {typeof link === 'string' ? link : link.url}
                                </td>
                                <td className="p-3 text-sm">
                                  {typeof link === 'object' && link.status
                                    ? link.status
                                    : 'Broken'}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <div id="section-analytics">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-semibold">Analytics</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Google Analytics 4 (GA4):
                  </span>
                  <Badge
                    className={
                      auditData.analysis?.analytics?.has_ga4
                        ? 'bg-green-100 text-green-800 border-green-200 text-xs'
                        : 'bg-red-100 text-red-800 border-red-200 text-xs'
                    }
                  >
                    {auditData.analysis?.analytics?.has_ga4 ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Universal Analytics:
                  </span>
                  <Badge
                    className={
                      auditData.analysis?.analytics?.has_universal_analytics
                        ? 'bg-green-100 text-green-800 border-green-200 text-xs'
                        : 'bg-red-100 text-red-800 border-red-200 text-xs'
                    }
                  >
                    {auditData.analysis?.analytics?.has_universal_analytics
                      ? 'Yes'
                      : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Google Tag Manager:
                  </span>
                  <Badge
                    className={
                      auditData.analysis?.analytics?.has_google_tag_manager
                        ? 'bg-green-100 text-green-800 border-green-200 text-xs'
                        : 'bg-red-100 text-red-800 border-red-200 text-xs'
                    }
                  >
                    {auditData.analysis?.analytics?.has_google_tag_manager
                      ? 'Yes'
                      : 'No'}
                  </Badge>
                </div>
                {auditData.analysis?.analytics?.gtm_container_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Container ID:</span>
                    <span className="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {auditData.analysis?.analytics?.gtm_container_id}
                    </span>
                  </div>
                )}
                {auditData.analysis?.analytics?.ga_tracking_ids && (
                  <div>
                    <span className="text-sm font-medium mb-2 block">
                      GA Tracking IDs:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {auditData.analysis.analytics.ga_tracking_ids.map(
                        (id: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded"
                          >
                            {id}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schema Markup Section */}
        <div id="section-schema-markup">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                <h3 className="text-lg font-semibold">Schema Markup</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Has Schema:</span>
                  <Badge
                    className={
                      auditData.analysis?.schema_markup?.has_schema
                        ? 'bg-green-100 text-green-800 border-green-200 text-xs'
                        : 'bg-red-100 text-red-800 border-red-200 text-xs'
                    }
                  >
                    {auditData.analysis?.schema_markup?.has_schema
                      ? 'Yes'
                      : 'No'}
                  </Badge>
                </div>
                {auditData.analysis?.schema_markup?.schema_types && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">
                            Schema Type
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {auditData.analysis.schema_markup.schema_types.map(
                          (type: string, i: number) => (
                            <tr key={i}>
                              <td className="p-3 text-sm font-mono">{type}</td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">JSON-LD</span>
                    </div>
                    <span className="text-sm">
                      {auditData.analysis?.schema_markup?.json_ld_count ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Microdata</span>
                    </div>
                    <span className="text-sm">
                      {auditData.analysis?.schema_markup?.microdata_count ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">RDFa</span>
                    </div>
                    <span className="text-sm">
                      {auditData.analysis?.schema_markup?.rdfa_count ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PageSpeed Insights Section */}
        <div id="section-pagespeed-insights">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-semibold">PageSpeed Insights</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Desktop */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">Desktop</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Score:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {Math.round(
                        auditData.analysis?.pagespeed?.desktop
                          ?.performance_score ?? 0
                      ) ?? '-'}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-medium mb-3">Core Web Vitals</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
                        <div className="text-xs font-medium text-green-800">
                          First Contentful Paint
                        </div>
                        <div className="text-sm font-bold text-green-800">
                          {auditData.analysis?.pagespeed?.desktop
                            ?.first_contentful_paint ?? '-'}
                        </div>
                      </div>
                      <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
                        <div className="text-xs font-medium text-green-800">
                          Speed Index
                        </div>
                        <div className="text-sm font-bold text-green-800">
                          {auditData.analysis?.pagespeed?.desktop
                            ?.speed_index ?? '-'}
                        </div>
                      </div>
                      <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
                        <div className="text-xs font-medium text-green-800">
                          Largest Contentful Paint
                        </div>
                        <div className="text-sm font-bold text-green-800">
                          {auditData.analysis?.pagespeed?.desktop
                            ?.largest_contentful_paint ?? '-'}
                        </div>
                      </div>
                      <div className="p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
                        <div className="text-xs font-medium text-yellow-800">
                          Time to Interactive
                        </div>
                        <div className="text-sm font-bold text-yellow-800">
                          {auditData.analysis?.pagespeed?.desktop
                            ?.time_to_interactive ?? '-'}
                        </div>
                      </div>
                      <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
                        <div className="text-xs font-medium text-green-800">
                          Total Blocking Time
                        </div>
                        <div className="text-sm font-bold text-green-800">
                          {auditData.analysis?.pagespeed?.desktop
                            ?.total_blocking_time ?? '-'}
                        </div>
                      </div>
                      <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
                        <div className="text-xs font-medium text-green-800">
                          Cumulative Layout Shift
                        </div>
                        <div className="text-sm font-bold text-green-800">
                          {auditData.analysis?.pagespeed?.desktop
                            ?.cumulative_layout_shift ?? '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Mobile */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">Mobile</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Score:</span>
                    <span className="text-2xl font-bold text-yellow-600">
                      {Math.round(
                        auditData.analysis?.pagespeed?.mobile
                          ?.performance_score ?? 0
                      ) ?? '-'}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-medium mb-3">Core Web Vitals</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                        <div className="text-xs font-medium text-red-800">
                          First Contentful Paint
                        </div>
                        <div className="text-sm font-bold text-red-800">
                          {auditData.analysis?.pagespeed?.mobile
                            ?.first_contentful_paint ?? '-'}
                        </div>
                      </div>
                      <div className="p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
                        <div className="text-xs font-medium text-yellow-800">
                          Speed Index
                        </div>
                        <div className="text-sm font-bold text-yellow-800">
                          {auditData.analysis?.pagespeed?.mobile?.speed_index ??
                            '-'}
                        </div>
                      </div>
                      <div className="p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
                        <div className="text-xs font-medium text-yellow-800">
                          Largest Contentful Paint
                        </div>
                        <div className="text-sm font-bold text-yellow-800">
                          {auditData.analysis?.pagespeed?.mobile
                            ?.largest_contentful_paint ?? '-'}
                        </div>
                      </div>
                      <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                        <div className="text-xs font-medium text-red-800">
                          Time to Interactive
                        </div>
                        <div className="text-sm font-bold text-red-800">
                          {auditData.analysis?.pagespeed?.mobile
                            ?.time_to_interactive ?? '-'}
                        </div>
                      </div>
                      <div className="p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
                        <div className="text-xs font-medium text-yellow-800">
                          Total Blocking Time
                        </div>
                        <div className="text-sm font-bold text-yellow-800">
                          {auditData.analysis?.pagespeed?.mobile
                            ?.total_blocking_time ?? '-'}
                        </div>
                      </div>
                      <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
                        <div className="text-xs font-medium text-green-800">
                          Cumulative Layout Shift
                        </div>
                        <div className="text-sm font-bold text-green-800">
                          {auditData.analysis?.pagespeed?.mobile
                            ?.cumulative_layout_shift ?? '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Performance Opportunities */}
              {auditData.analysis?.pagespeed?.opportunities && (
                <div className="mt-6">
                  <h5 className="font-medium mb-3">
                    Performance Opportunities
                  </h5>
                  <div className="space-y-2">
                    {auditData.analysis.pagespeed.opportunities.map(
                      (opp: any, i: number) => (
                        <div key={i} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              {opp.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {opp.display_value}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {opp.description}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Redirect Chain Section */}
        <div id="section-redirect-chain">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                <h3 className="text-lg font-semibold">Redirect Chain</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Chain Length:</span>
                  <span className="text-sm">
                    {auditData.analysis?.redirect_chain?.chain_length ?? 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Has Chain:</span>
                  <Badge
                    className={
                      auditData.analysis?.redirect_chain?.has_chain
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200 text-xs'
                        : 'bg-green-100 text-green-800 border-green-200 text-xs'
                    }
                  >
                    {auditData.analysis?.redirect_chain?.has_chain
                      ? 'Yes'
                      : 'No'}
                  </Badge>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Step</th>
                        <th className="text-left p-3 font-medium">URL</th>
                        <th className="text-left p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(auditData.analysis?.redirect_chain?.chain || []).map(
                        (step: any, i: number) => (
                          <tr key={i}>
                            <td className="p-3 text-sm">{i + 1}</td>
                            <td className="p-3 text-sm">{step.url}</td>
                            <td className="p-3 text-sm">{step.status_code}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 404 Page Check Section */}
        <div id="section-404-page-check">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold">404 Page Check</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status Code:</span>
                  <span className="text-sm">
                    {auditData.analysis?.custom_404?.status_code ?? '-'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Custom 404 Detected:
                  </span>
                  <Badge
                    className={
                      auditData.analysis?.custom_404?.has_custom_404
                        ? 'bg-green-100 text-green-800 border-green-200 text-xs'
                        : 'bg-red-100 text-red-800 border-red-200 text-xs'
                    }
                  >
                    {auditData.analysis?.custom_404?.has_custom_404
                      ? 'Yes'
                      : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Is Soft 404:</span>
                  <Badge
                    className={
                      auditData.analysis?.custom_404?.is_soft_404
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200 text-xs'
                        : 'bg-green-100 text-green-800 border-green-200 text-xs'
                    }
                  >
                    {auditData.analysis?.custom_404?.is_soft_404 ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* HTTPS Security Section */}
        <div id="section-https-security">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold">HTTPS Security</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">HTTPS Enabled:</span>
                  <Badge
                    className={
                      auditData.analysis?.https?.is_https
                        ? 'bg-green-100 text-green-800 border-green-200 text-xs'
                        : 'bg-red-100 text-red-800 border-red-200 text-xs'
                    }
                  >
                    {auditData.analysis?.https?.is_https ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Redirects to HTTPS:
                  </span>
                  <Badge
                    className={
                      auditData.analysis?.https?.redirects_to_https
                        ? 'bg-green-100 text-green-800 border-green-200 text-xs'
                        : 'bg-red-100 text-red-800 border-red-200 text-xs'
                    }
                  >
                    {auditData.analysis?.https?.redirects_to_https
                      ? 'Yes'
                      : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Valid SSL Certificate:
                  </span>
                  <Badge
                    className={
                      auditData.analysis?.https?.ssl_info?.valid_certificate
                        ? 'bg-green-100 text-green-800 border-green-200 text-xs'
                        : 'bg-red-100 text-red-800 border-red-200 text-xs'
                    }
                  >
                    {auditData.analysis?.https?.ssl_info?.valid_certificate
                      ? 'Yes'
                      : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">HTTP URL:</span>
                  <span className="text-sm text-muted-foreground">
                    {auditData.analysis?.https?.http_url || '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sitemap Section */}
        <div id="section-sitemap">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                <h3 className="text-lg font-semibold">Sitemap Analysis</h3>
              </div>

              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        auditData.analysis?.sitemap?.exists
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    ></div>
                    <span className="text-xs font-medium text-blue-800">
                      Status
                    </span>
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    {auditData.analysis?.sitemap?.exists
                      ? 'Found'
                      : 'Not Found'}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs font-medium text-green-800">
                      URLs
                    </span>
                  </div>
                  <div className="text-lg font-bold text-green-900">
                    {auditData.analysis?.sitemap?.url_count ?? 0}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-xs font-medium text-purple-800">
                      Sitemaps
                    </span>
                  </div>
                  <div className="text-lg font-bold text-purple-900">
                    {auditData.analysis?.sitemap?.sitemap_count ?? 0}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        auditData.analysis?.sitemap?.is_valid_xml
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    ></div>
                    <span className="text-xs font-medium text-orange-800">
                      XML Valid
                    </span>
                  </div>
                  <div className="text-lg font-bold text-orange-900">
                    {auditData.analysis?.sitemap?.is_valid_xml ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>

              {/* Main Sitemap Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium mb-3 text-gray-900">Main Sitemap</h4>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">URL:</span>
                    <a
                      href={auditData.analysis?.sitemap?.found_at}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline text-sm font-mono bg-white px-2 py-1 rounded border"
                      title={auditData.analysis?.sitemap?.found_at}
                    >
                      {auditData.analysis?.sitemap?.found_at || 'Not found'}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <Badge
                      className={
                        auditData.analysis?.sitemap?.is_index
                          ? 'bg-blue-100 text-blue-800 border-blue-200 text-xs'
                          : 'bg-gray-100 text-gray-800 border-gray-200 text-xs'
                      }
                    >
                      {auditData.analysis?.sitemap?.is_index
                        ? 'Index Sitemap'
                        : 'Regular Sitemap'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Sitemaps in Index */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 text-blue-900 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Sitemaps in Index (
                  {auditData.analysis?.sitemap?.sitemap_list?.length || 0})
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">URL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(auditData.analysis?.sitemap?.sitemap_list || [])
                          .length === 0 ? (
                          <tr>
                            <td className="p-3 text-xs text-muted-foreground text-center">
                              No sitemaps found in index.
                            </td>
                          </tr>
                        ) : (
                          auditData.analysis.sitemap.sitemap_list.map(
                            (url: string, i: number) => (
                              <tr key={i}>
                                <td className="p-3 text-sm break-all">
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-700 hover:underline"
                                    title={url}
                                  >
                                    {url}
                                  </a>
                                </td>
                              </tr>
                            )
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Discovered URLs */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 text-green-900 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Discovered URLs (
                  {auditData.analysis?.sitemap?.url_list?.length || 0})
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">URL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(auditData.analysis?.sitemap?.url_list || [])
                          .length === 0 ? (
                          <tr>
                            <td className="p-3 text-xs text-muted-foreground text-center">
                              No discovered URLs found.
                            </td>
                          </tr>
                        ) : (
                          auditData.analysis.sitemap.url_list.map(
                            (url: string, i: number) => (
                              <tr key={i}>
                                <td className="p-3 text-sm break-all">
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-700 hover:underline"
                                    title={url}
                                  >
                                    {url}
                                  </a>
                                </td>
                              </tr>
                            )
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* No Sitemap Warning */}
              {!auditData.analysis?.sitemap?.exists && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                    <h4 className="font-medium text-red-900">
                      No Sitemap Found
                    </h4>
                  </div>
                  <p className="text-sm text-red-700">
                    No sitemap was found for this website. Consider creating a
                    sitemap to help search engines discover and index your pages
                    more effectively.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* WWW Resolve Section */}
        <div id="section-www-resolve">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                <h3 className="text-lg font-semibold">WWW Resolve</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Resolves to Same:</span>
                  <Badge
                    className={
                      auditData.analysis?.www_resolve?.resolves_to_same
                        ? 'bg-green-100 text-green-800 border-green-200 text-xs'
                        : 'bg-red-100 text-red-800 border-red-200 text-xs'
                    }
                  >
                    {auditData.analysis?.www_resolve?.resolves_to_same
                      ? 'Yes'
                      : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Has Redirects:</span>
                  <Badge
                    className={
                      auditData.analysis?.www_resolve?.redirects
                        ? 'bg-green-100 text-green-800 border-green-200 text-xs'
                        : 'bg-red-100 text-red-800 border-red-200 text-xs'
                    }
                  >
                    {auditData.analysis?.www_resolve?.redirects ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Preferred URL:</span>
                  <span className="text-sm text-muted-foreground">
                    {auditData.analysis?.www_resolve?.preferred_url || '-'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-medium mb-2">WWW URL</h5>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium">URL:</span>{' '}
                        <span className="text-muted-foreground">
                          {auditData.analysis?.www_resolve?.www_url || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{' '}
                        <span className="text-muted-foreground">
                          {auditData.analysis?.www_resolve?.www_status || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Final URL:</span>{' '}
                        <span className="text-muted-foreground">
                          {auditData.analysis?.www_resolve?.www_final_url ||
                            '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-medium mb-2">Non-WWW URL</h5>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium">URL:</span>{' '}
                        <span className="text-muted-foreground">
                          {auditData.analysis?.www_resolve?.non_www_url || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{' '}
                        <span className="text-muted-foreground">
                          {auditData.analysis?.www_resolve?.non_www_status ||
                            '-'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Final URL:</span>{' '}
                        <span className="text-muted-foreground">
                          {auditData.analysis?.www_resolve?.non_www_final_url ||
                            '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inner Pages Meta Audit Section */}
        <div id="section-inner-pages-meta-audit">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                <h3 className="text-lg font-semibold">
                  Inner Pages Meta Audit
                </h3>
              </div>
              {/* Summary Grid Row */}
              {auditData.analysis?.inner_summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    {
                      label: 'Total Pages',
                      count: auditData.analysis.inner_summary.total_pages ?? 0,
                      color: 'bg-blue-50 border-blue-200',
                      icon: <List className="w-5 h-5 text-blue-600" />,
                    },
                    {
                      label: 'Duplicate Titles',
                      count:
                        auditData.analysis.inner_summary.duplicate_titles
                          ?.length ?? 0,
                      color: 'bg-yellow-50 border-yellow-200',
                      icon: <Copy className="w-5 h-5 text-yellow-500" />,
                    },
                    {
                      label: 'Duplicate Descriptions',
                      count:
                        auditData.analysis.inner_summary.duplicate_desc_groups
                          ?.length ?? 0,
                      color: 'bg-yellow-50 border-yellow-200',
                      icon: (
                        <AlignJustify className="w-5 h-5 text-yellow-500" />
                      ),
                    },
                    {
                      label: 'Missing Titles',
                      count:
                        auditData.analysis.inner_summary.missing_titles ?? 0,
                      color: 'bg-red-50 border-red-200',
                      icon: <XCircle className="w-5 h-5 text-red-500" />,
                    },
                    {
                      label: 'Missing Descriptions',
                      count:
                        auditData.analysis.inner_summary.missing_descriptions ??
                        0,
                      color: 'bg-red-50 border-red-200',
                      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
                    },
                    {
                      label: 'Title Length Issues',
                      count:
                        auditData.analysis.inner_summary.title_length_issues
                          ?.length ?? 0,
                      color: 'bg-purple-50 border-purple-200',
                      icon: <Ruler className="w-5 h-5 text-purple-600" />,
                    },
                    {
                      label: 'Meta Description Length Issues',
                      count:
                        auditData.analysis.inner_summary.desc_length_issues
                          ?.length ?? 0,
                      color: 'bg-purple-50 border-purple-200',
                      icon: <Ruler className="w-5 h-5 text-purple-600" />,
                    },
                    {
                      label: 'Orphan Pages',
                      count: auditData.analysis.inner_summary.orphan_count ?? 0,
                      color: 'bg-green-50 border-green-200',
                      icon: <Link2Off className="w-5 h-5 text-green-600" />,
                    },
                  ].map((chip, i) => (
                    <div
                      key={i}
                      className={`flex flex-col items-start gap-2 rounded-xl border p-4 shadow-sm ${chip.color}`}
                    >
                      <div className="flex items-center gap-2">
                        {chip.icon}
                        <span className="text-2xl font-bold text-gray-900">
                          {chip.count}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-gray-600 mt-1">
                        {chip.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-6">
                {/* Duplicate Titles */}
                <div id="sub-duplicate-titles">
                  <h4 className="font-medium mb-3">
                    Duplicate Titles (
                    {auditData.analysis?.inner_summary?.duplicate_pages ?? 0})
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">URL</th>
                            <th className="text-left p-3 font-medium">Title</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(() => {
                            const df = auditData.analysis?.inner_audit_df || [];
                            // Find duplicate titles
                            const titleMap = new Map();
                            df.forEach((row: any) => {
                              if (row.Title) {
                                if (!titleMap.has(row.Title))
                                  titleMap.set(row.Title, []);
                                titleMap.get(row.Title).push(row);
                              }
                            });
                            const duplicates = Array.from(titleMap.values())
                              .filter((arr) => arr.length > 1)
                              .flat();
                            if (duplicates.length === 0) {
                              return (
                                <tr>
                                  <td
                                    colSpan={2}
                                    className="p-3 text-xs text-muted-foreground text-center"
                                  >
                                    No duplicate titles found.
                                  </td>
                                </tr>
                              );
                            }
                            return duplicates.map((row: any, i: number) => (
                              <tr key={i}>
                                <td className="p-3 text-sm break-all max-w-xs">
                                  <a
                                    href={row.URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-700 hover:underline"
                                    title={row.URL}
                                  >
                                    {row.URL}
                                  </a>
                                </td>
                                <td className="p-3 text-sm break-words">
                                  {row.Title}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {/* Duplicate Descriptions */}
                <div id="sub-duplicate-descriptions">
                  <h4 className="font-medium mb-3">
                    Duplicate Descriptions (
                    {auditData.analysis?.inner_summary?.duplicate_desc_pages ??
                      0}
                    )
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">URL</th>
                            <th className="text-left p-3 font-medium">
                              Meta Description
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(() => {
                            const df = auditData.analysis?.inner_audit_df || [];
                            // Find duplicate meta descriptions
                            const descMap = new Map();
                            df.forEach((row: any) => {
                              const desc = row['Meta Description'];
                              if (desc) {
                                if (!descMap.has(desc)) descMap.set(desc, []);
                                descMap.get(desc).push(row);
                              }
                            });
                            const duplicates = Array.from(descMap.values())
                              .filter((arr) => arr.length > 1)
                              .flat();
                            if (duplicates.length === 0) {
                              return (
                                <tr>
                                  <td
                                    colSpan={2}
                                    className="p-3 text-xs text-muted-foreground text-center"
                                  >
                                    No duplicate descriptions found.
                                  </td>
                                </tr>
                              );
                            }
                            return duplicates.map((row: any, i: number) => (
                              <tr key={i}>
                                <td className="p-3 text-sm break-all max-w-xs">
                                  <a
                                    href={row.URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-700 hover:underline"
                                    title={row.URL}
                                  >
                                    {row.URL}
                                  </a>
                                </td>
                                <td className="p-3 text-sm break-words">
                                  {row['Meta Description']}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {/* Missing Titles */}
                <div id="sub-missing-titles">
                  <h4 className="font-medium mb-3">
                    Missing Titles (
                    {auditData.analysis?.inner_summary?.missing_titles ?? 0})
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">URL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(
                            auditData.analysis?.inner_summary
                              ?.missing_titles_list || []
                          ).length === 0 ? (
                            <tr>
                              <td className="p-3 text-xs text-muted-foreground text-center">
                                No missing titles found.
                              </td>
                            </tr>
                          ) : (
                            auditData.analysis.inner_summary.missing_titles_list.map(
                              (url: string, i: number) => (
                                <tr key={i}>
                                  <td className="p-3 text-sm break-all">
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-700 hover:underline"
                                      title={url}
                                    >
                                      {url}
                                    </a>
                                  </td>
                                </tr>
                              )
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {/* Missing Descriptions */}
                <div id="sub-missing-descriptions">
                  <h4 className="font-medium mb-3">
                    Missing Descriptions (
                    {auditData.analysis?.inner_summary?.missing_descriptions ??
                      0}
                    )
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">URL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(
                            auditData.analysis?.inner_summary
                              ?.missing_descriptions_list || []
                          ).length === 0 ? (
                            <tr>
                              <td className="p-3 text-xs text-muted-foreground text-center">
                                No missing descriptions found.
                              </td>
                            </tr>
                          ) : (
                            auditData.analysis.inner_summary.missing_descriptions_list.map(
                              (url: string, i: number) => (
                                <tr key={i}>
                                  <td className="p-3 text-sm break-all">
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-700 hover:underline"
                                      title={url}
                                    >
                                      {url}
                                    </a>
                                  </td>
                                </tr>
                              )
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {/* Title Length Issues */}
                <div id="sub-title-length-issues">
                  <h4 className="font-medium mb-3">Title Length Issues</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">URL</th>
                            <th className="text-left p-3 font-medium">Title</th>
                            <th className="text-left p-3 font-medium">
                              Title Length
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(() => {
                            const urls =
                              auditData.analysis?.inner_summary
                                ?.title_length_issues || [];
                            const df = auditData.analysis?.inner_audit_df || [];
                            const rows = df.filter((row: any) =>
                              urls.includes(row.URL)
                            );
                            if (rows.length === 0) {
                              return (
                                <tr>
                                  <td
                                    colSpan={3}
                                    className="p-3 text-xs text-muted-foreground text-center"
                                  >
                                    No title length issues found.
                                  </td>
                                </tr>
                              );
                            }
                            return rows.map((row: any, i: number) => (
                              <tr key={i}>
                                <td className="p-3 text-sm break-all max-w-xs">
                                  <a
                                    href={row.URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-700 hover:underline"
                                    title={row.URL}
                                  >
                                    {row.URL}
                                  </a>
                                </td>
                                <td className="p-3 text-sm break-words">
                                  {row.Title}
                                </td>
                                <td className="p-3 text-sm">
                                  {row['Title Length']}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {/* Meta Description Length Issues */}
                <div id="sub-meta-description-length-issues">
                  <h4 className="font-medium mb-3">
                    Meta Description Length Issues
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">URL</th>
                            <th className="text-left p-3 font-medium">
                              Meta Description
                            </th>
                            <th className="text-left p-3 font-medium">
                              Description Length
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(() => {
                            const urls =
                              auditData.analysis?.inner_summary
                                ?.desc_length_issues || [];
                            const df = auditData.analysis?.inner_audit_df || [];
                            const rows = df.filter((row: any) =>
                              urls.includes(row.URL)
                            );
                            if (rows.length === 0) {
                              return (
                                <tr>
                                  <td
                                    colSpan={3}
                                    className="p-3 text-xs text-muted-foreground text-center"
                                  >
                                    No meta description length issues found.
                                  </td>
                                </tr>
                              );
                            }
                            return rows.map((row: any, i: number) => (
                              <tr key={i}>
                                <td className="p-3 text-sm break-all max-w-xs">
                                  <a
                                    href={row.URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-700 hover:underline"
                                    title={row.URL}
                                  >
                                    {row.URL}
                                  </a>
                                </td>
                                <td className="p-3 text-sm break-words">
                                  {row['Meta Description']}
                                </td>
                                <td className="p-3 text-sm">
                                  {row['Description Length']}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {/* Orphan Pages */}
                <div id="sub-orphan-pages">
                  <h4 className="font-medium mb-3">
                    Orphan Pages (
                    {auditData.analysis?.inner_summary?.orphan_count ?? 0})
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">URL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(
                            auditData.analysis?.inner_summary?.orphan_pages ||
                            []
                          ).length === 0 ? (
                            <tr>
                              <td className="p-3 text-xs text-muted-foreground text-center">
                                No orphan pages found.
                              </td>
                            </tr>
                          ) : (
                            auditData.analysis.inner_summary.orphan_pages.map(
                              (url: string, i: number) => (
                                <tr key={i}>
                                  <td className="p-3 text-sm break-all">
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-700 hover:underline"
                                      title={url}
                                    >
                                      {url}
                                    </a>
                                  </td>
                                </tr>
                              )
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // --- Export Site Audit to Excel ---
  const handleExportAudit = () => {
    if (!auditData) return;
    const wb = XLSX.utils.book_new();

    // Helper to add a worksheet
    const addSheet = (name: string, data: any[][]) => {
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    // Summary
    addSheet('Summary', [
      ['Site', auditData.url || auditData.canonical_url],
      ['Canonical URL', auditData.canonical_url || '-'],
      ['Status', 'Completed'],
    ]);

    // Recommendations
    addSheet('Recommendations', [
      ['Recommendation'],
      ...(auditData.recommendations || []).map((rec: string) => [
        rec.replace(/^\[.*?\]\s*/, ''),
      ]),
    ]);

    // Meta Tags
    addSheet('Meta Tags', [
      ['Title', auditData.analysis?.meta_tags?.title || '-'],
      ['Title Length', auditData.analysis?.meta_tags?.title_length ?? '-'],
      [
        'Meta Description',
        auditData.analysis?.meta_tags?.meta_description || '-',
      ],
      [
        'Description Length',
        auditData.analysis?.meta_tags?.meta_description_length ?? '-',
      ],
      [
        'Has Viewport',
        auditData.analysis?.meta_tags?.has_viewport ? 'Yes' : 'No',
      ],
      ['Has Robots', auditData.analysis?.meta_tags?.has_robots ? 'Yes' : 'No'],
      ['Robots Content', auditData.analysis?.meta_tags?.robots_content || '-'],
      [
        'Has Canonical',
        auditData.analysis?.meta_tags?.has_canonical ? 'Yes' : 'No',
      ],
      ['Canonical URL', auditData.analysis?.meta_tags?.canonical_url || '-'],
      [
        'Has Hreflang',
        auditData.analysis?.meta_tags?.has_hreflang ? 'Yes' : 'No',
      ],
      [
        'Hreflang Tags',
        (auditData.analysis?.meta_tags?.hreflang_tags || []).join(', '),
      ],
    ]);

    // Headings
    addSheet('Headings', [
      ['Level', 'Text'],
      ...['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].flatMap((level) =>
        (auditData.analysis?.headings?.[level] || []).map((text: string) => [
          level.toUpperCase(),
          text,
        ])
      ),
    ]);

    // Content Analysis
    addSheet('Content Analysis', [
      ['Word Count', auditData.analysis?.content?.word_count ?? '-'],
      [],
      ['Top Keywords', 'Count'],
      ...(auditData.analysis?.content?.top_keywords || []).map((kw: any) => [
        kw[0],
        kw[1],
      ]),
    ]);

    // Technical SEO
    addSheet('Technical SEO', [
      ['Robots.txt Present', auditData.analysis?.robots?.exists ? 'Yes' : 'No'],
      [
        'Crawlable by Search Engines',
        auditData.analysis?.robots?.blocks_search_engines ? 'No' : 'Yes',
      ],
      [
        'Blocked by robots.txt',
        auditData.analysis?.accessibility?.blocked_by_robots_txt ? 'Yes' : 'No',
      ],
      [
        'Blocked by Meta Robots Tag',
        auditData.analysis?.accessibility?.blocked_by_meta_robots
          ? 'Yes'
          : 'No',
      ],
      [
        'Blocked by X-Robots-Tag Header',
        auditData.analysis?.accessibility?.blocked_by_x_robots_header
          ? 'Yes'
          : 'No',
      ],
      [
        'Blocked Search Engines',
        (auditData.analysis?.accessibility?.blocked_engines || []).join(', ') ||
          'None',
      ],
      [
        'Allowed Search Engines',
        (auditData.analysis?.accessibility?.allowed_engines || []).join(', ') ||
          'None',
      ],
      [],
      ['robots.txt Content'],
      ...(auditData.analysis?.robots?.content || '')
        .split('\n')
        .map((line: string) => [line]),
    ]);

    // Images
    addSheet('Images', [
      ['Src', 'Alt Text', 'Has Alt'],
      ...(auditData.analysis?.images || []).map((img: any) => [
        img.src,
        img.alt,
        img.has_alt ? 'Yes' : 'No',
      ]),
    ]);

    // Links
    addSheet('Internal Links', [
      ['URL', 'Text', 'Nofollow'],
      ...(auditData.analysis?.links?.internal_links || []).map((link: any) => [
        link.url,
        link.text,
        link.nofollow ? 'Yes' : 'No',
      ]),
    ]);
    addSheet('External Links', [
      ['URL', 'Text', 'Nofollow'],
      ...(auditData.analysis?.links?.external_links || []).map((link: any) => [
        link.url,
        link.text,
        link.nofollow ? 'Yes' : 'No',
      ]),
    ]);

    // Analytics
    addSheet('Analytics', [
      [
        'Google Analytics',
        auditData.analysis?.analytics?.has_google_analytics ? 'Yes' : 'No',
      ],
      [
        'Google Analytics 4 (GA4)',
        auditData.analysis?.analytics?.has_ga4 ? 'Yes' : 'No',
      ],
      [
        'Universal Analytics',
        auditData.analysis?.analytics?.has_universal_analytics ? 'Yes' : 'No',
      ],
      [
        'Google Tag Manager',
        auditData.analysis?.analytics?.has_google_tag_manager ? 'Yes' : 'No',
      ],
      [
        'GTM Container ID',
        auditData.analysis?.analytics?.gtm_container_id || '-',
      ],
      [
        'GA Tracking IDs',
        (auditData.analysis?.analytics?.ga_tracking_ids || []).join(', '),
      ],
    ]);

    // Schema Markup
    addSheet('Schema Markup', [
      [
        'Has Schema',
        auditData.analysis?.schema_markup?.has_schema ? 'Yes' : 'No',
      ],
      [
        'Schema Types',
        (auditData.analysis?.schema_markup?.schema_types || []).join(', '),
      ],
      ['JSON-LD', auditData.analysis?.schema_markup?.json_ld_count ?? 0],
      ['Microdata', auditData.analysis?.schema_markup?.microdata_count ?? 0],
      ['RDFa', auditData.analysis?.schema_markup?.rdfa_count ?? 0],
    ]);

    // PageSpeed Insights
    addSheet('PageSpeed Insights', [
      [
        'Device',
        'Performance Score',
        'Accessibility',
        'Best Practices',
        'SEO',
        'First Contentful Paint',
        'Speed Index',
        'Largest Contentful Paint',
        'Time to Interactive',
        'Total Blocking Time',
        'Cumulative Layout Shift',
      ],
      [
        'Desktop',
        auditData.analysis?.pagespeed?.desktop?.performance_score ?? '-',
        auditData.analysis?.pagespeed?.desktop?.accessibility_score ?? '-',
        auditData.analysis?.pagespeed?.desktop?.best_practices_score ?? '-',
        auditData.analysis?.pagespeed?.desktop?.seo_score ?? '-',
        auditData.analysis?.pagespeed?.desktop?.first_contentful_paint ?? '-',
        auditData.analysis?.pagespeed?.desktop?.speed_index ?? '-',
        auditData.analysis?.pagespeed?.desktop?.largest_contentful_paint ?? '-',
        auditData.analysis?.pagespeed?.desktop?.time_to_interactive ?? '-',
        auditData.analysis?.pagespeed?.desktop?.total_blocking_time ?? '-',
        auditData.analysis?.pagespeed?.desktop?.cumulative_layout_shift ?? '-',
      ],
      [
        'Mobile',
        auditData.analysis?.pagespeed?.mobile?.performance_score ?? '-',
        auditData.analysis?.pagespeed?.mobile?.accessibility_score ?? '-',
        auditData.analysis?.pagespeed?.mobile?.best_practices_score ?? '-',
        auditData.analysis?.pagespeed?.mobile?.seo_score ?? '-',
        auditData.analysis?.pagespeed?.mobile?.first_contentful_paint ?? '-',
        auditData.analysis?.pagespeed?.mobile?.speed_index ?? '-',
        auditData.analysis?.pagespeed?.mobile?.largest_contentful_paint ?? '-',
        auditData.analysis?.pagespeed?.mobile?.time_to_interactive ?? '-',
        auditData.analysis?.pagespeed?.mobile?.total_blocking_time ?? '-',
        auditData.analysis?.pagespeed?.mobile?.cumulative_layout_shift ?? '-',
      ],
    ]);

    // Redirect Chain
    addSheet('Redirect Chain', [
      ['Chain Length', auditData.analysis?.redirect_chain?.chain_length ?? 0],
      [
        'Has Chain',
        auditData.analysis?.redirect_chain?.has_chain ? 'Yes' : 'No',
      ],
      [],
      ['Step', 'URL', 'Status Code'],
      ...(auditData.analysis?.redirect_chain?.chain || []).map(
        (step: any, i: number) => [i + 1, step.url, step.status_code]
      ),
    ]);

    // 404 Page Check
    addSheet('404 Page Check', [
      ['Status Code', auditData.analysis?.custom_404?.status_code ?? '-'],
      [
        'Custom 404 Detected',
        auditData.analysis?.custom_404?.has_custom_404 ? 'Yes' : 'No',
      ],
      [
        'Is Soft 404',
        auditData.analysis?.custom_404?.is_soft_404 ? 'Yes' : 'No',
      ],
    ]);

    // HTTPS Security
    addSheet('HTTPS Security', [
      ['HTTPS Enabled', auditData.analysis?.https?.is_https ? 'Yes' : 'No'],
      [
        'Redirects to HTTPS',
        auditData.analysis?.https?.redirects_to_https ? 'Yes' : 'No',
      ],
      [
        'Valid SSL Certificate',
        auditData.analysis?.https?.ssl_info?.valid_certificate ? 'Yes' : 'No',
      ],
      ['HTTP URL', auditData.analysis?.https?.http_url || '-'],
    ]);

    // Sitemap
    addSheet('Sitemap', [
      ['Status', auditData.analysis?.sitemap?.exists ? 'Found' : 'Not Found'],
      ['URLs', auditData.analysis?.sitemap?.url_count ?? 0],
      ['Sitemaps', auditData.analysis?.sitemap?.sitemap_count ?? 0],
      ['XML Valid', auditData.analysis?.sitemap?.is_valid_xml ? 'Yes' : 'No'],
      ['Found At', auditData.analysis?.sitemap?.found_at || 'Not found'],
      [
        'Type',
        auditData.analysis?.sitemap?.is_index
          ? 'Index Sitemap'
          : 'Regular Sitemap',
      ],
      [],
      ['Sitemaps in Index'],
      ...(auditData.analysis?.sitemap?.sitemap_list || []).map(
        (url: string) => [url]
      ),
      [],
      ['Discovered URLs'],
      ...(auditData.analysis?.sitemap?.url_list || []).map((url: string) => [
        url,
      ]),
    ]);

    // WWW Resolve
    addSheet('WWW Resolve', [
      [
        'Resolves to Same',
        auditData.analysis?.www_resolve?.resolves_to_same ? 'Yes' : 'No',
      ],
      [
        'Has Redirects',
        auditData.analysis?.www_resolve?.redirects ? 'Yes' : 'No',
      ],
      ['Preferred URL', auditData.analysis?.www_resolve?.preferred_url || '-'],
      [],
      ['WWW URL', auditData.analysis?.www_resolve?.www_url || '-'],
      ['WWW Status', auditData.analysis?.www_resolve?.www_status || '-'],
      ['WWW Final URL', auditData.analysis?.www_resolve?.www_final_url || '-'],
      [],
      ['Non-WWW URL', auditData.analysis?.www_resolve?.non_www_url || '-'],
      [
        'Non-WWW Status',
        auditData.analysis?.www_resolve?.non_www_status || '-',
      ],
      [
        'Non-WWW Final URL',
        auditData.analysis?.www_resolve?.non_www_final_url || '-',
      ],
    ]);

    // Inner Pages Meta Audit Summary
    addSheet('Inner Pages Summary', [
      ['Total Pages', auditData.analysis?.inner_summary?.total_pages ?? 0],
      [
        'Duplicate Titles',
        auditData.analysis?.inner_summary?.duplicate_titles?.length ?? 0,
      ],
      [
        'Duplicate Descriptions',
        auditData.analysis?.inner_summary?.duplicate_desc_groups?.length ?? 0,
      ],
      [
        'Missing Titles',
        auditData.analysis?.inner_summary?.missing_titles ?? 0,
      ],
      [
        'Missing Descriptions',
        auditData.analysis?.inner_summary?.missing_descriptions ?? 0,
      ],
      [
        'Title Length Issues',
        auditData.analysis?.inner_summary?.title_length_issues?.length ?? 0,
      ],
      [
        'Meta Description Length Issues',
        auditData.analysis?.inner_summary?.desc_length_issues?.length ?? 0,
      ],
      ['Orphan Pages', auditData.analysis?.inner_summary?.orphan_count ?? 0],
    ]);

    // Duplicate Titles
    (() => {
      const df = auditData.analysis?.inner_audit_df || [];
      const titleMap = new Map();
      df.forEach((row: any) => {
        if (row.Title) {
          if (!titleMap.has(row.Title)) titleMap.set(row.Title, []);
          titleMap.get(row.Title).push(row);
        }
      });
      const duplicates = Array.from(titleMap.values())
        .filter((arr) => arr.length > 1)
        .flat();
      addSheet('Duplicate Titles', [
        ['URL', 'Title'],
        ...duplicates.map((row: any) => [row.URL, row.Title]),
      ]);
    })();

    // Duplicate Descriptions
    (() => {
      const df = auditData.analysis?.inner_audit_df || [];
      const descMap = new Map();
      df.forEach((row: any) => {
        const desc = row['Meta Description'];
        if (desc) {
          if (!descMap.has(desc)) descMap.set(desc, []);
          descMap.get(desc).push(row);
        }
      });
      const duplicates = Array.from(descMap.values())
        .filter((arr) => arr.length > 1)
        .flat();
      addSheet('Duplicate Descriptions', [
        ['URL', 'Meta Description'],
        ...duplicates.map((row: any) => [row.URL, row['Meta Description']]),
      ]);
    })();

    // Missing Titles
    addSheet('Missing Titles', [
      ['URL'],
      ...(auditData.analysis?.inner_summary?.missing_titles_list || []).map(
        (url: string) => [url]
      ),
    ]);

    // Missing Descriptions
    addSheet('Missing Descriptions', [
      ['URL'],
      ...(
        auditData.analysis?.inner_summary?.missing_descriptions_list || []
      ).map((url: string) => [url]),
    ]);

    // Title Length Issues
    (() => {
      const urls = auditData.analysis?.inner_summary?.title_length_issues || [];
      const df = auditData.analysis?.inner_audit_df || [];
      const rows = df.filter((row: any) => urls.includes(row.URL));
      addSheet('Title Length Issues', [
        ['URL', 'Title', 'Title Length'],
        ...rows.map((row: any) => [row.URL, row.Title, row['Title Length']]),
      ]);
    })();

    // Meta Description Length Issues
    (() => {
      const urls = auditData.analysis?.inner_summary?.desc_length_issues || [];
      const df = auditData.analysis?.inner_audit_df || [];
      const rows = df.filter((row: any) => urls.includes(row.URL));
      addSheet('Meta Desc Length Issues', [
        ['URL', 'Meta Description', 'Description Length'],
        ...rows.map((row: any) => [
          row.URL,
          row['Meta Description'],
          row['Description Length'],
        ]),
      ]);
    })();

    // Orphan Pages
    addSheet('Orphan Pages', [
      ['URL'],
      ...(auditData.analysis?.inner_summary?.orphan_pages || []).map(
        (url: string) => [url]
      ),
    ]);

    // Download
    XLSX.writeFile(wb, 'site-audit.xlsx');
  };

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-6 max-w-[calc(100%_-_15rem)] min-w-0 overflow-hidden">
        {/* Export Button */}
        {auditData && (
          <div className="flex justify-end mb-4 gap-2">
            <Button
              onClick={startAudit}
              variant="secondary"
              className="gap-2"
              disabled={loading}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 20 20"
                className="w-4 h-4"
              >
                <path
                  d="M10 2a8 8 0 108 8h-2a6 6 0 11-6-6V2z"
                  fill="currentColor"
                />
                <path
                  d="M10 6v4l3 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Refresh Audit Report
            </Button>
            <Button
              onClick={handleExportAudit}
              variant="outline"
              className="gap-2"
            >
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 20 20"
                className="w-4 h-4"
              >
                <path
                  d="M12 3v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 10.586V3a1 1 0 112 0z"
                  fill="currentColor"
                />
                <path
                  d="M4 15a1 1 0 011-1h10a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z"
                  fill="currentColor"
                />
              </svg>
              Export Site Audit
            </Button>
          </div>
        )}
        {renderContent()}
      </div>
      {/* Right Sidebar - SEO Audit Navigation */}
      <div className="w-60 bg-background/50 backdrop-blur-sm border border-border/40 rounded-lg sticky top-[100px] h-[calc(100vh-200px)] flex flex-col">
        <div className="p-4 border-b border-border/40">
          <h3 className="font-semibold text-sm text-foreground">
            SEO Audit Navigation
          </h3>
        </div>
        <div
          ref={navigationRef}
          className="flex-1 overflow-y-auto p-4 space-y-1"
        >
          {/* Main Navigation Items */}
          {[
            {
              id: 'section-summary',
              icon: <BarChart3 className="h-3 w-3" />,
              label: 'Summary',
            },
            {
              id: 'section-recommendations',
              icon: <Target className="h-3 w-3" />,
              label: 'Recommendations',
              iconColor: 'text-yellow-500',
              borderColor: 'border-yellow-200',
            },
            {
              id: 'section-meta-tags',
              icon: <FileText className="h-3 w-3" />,
              label: 'Meta Tags',
            },
            {
              id: 'section-headings',
              icon: <BarChart3 className="h-3 w-3" />,
              label: 'Headings',
            },
            {
              id: 'section-content-analysis',
              icon: <BarChart3 className="h-3 w-3" />,
              label: 'Content Analysis',
            },
            {
              id: 'section-technical-seo',
              icon: <Settings className="h-3 w-3" />,
              label: 'Technical SEO',
            },
            {
              id: 'section-images',
              icon: <Eye className="h-3 w-3" />,
              label: 'Images',
            },
            {
              id: 'section-links',
              icon: <FileText className="h-3 w-3" />,
              label: 'Links',
              iconColor: 'text-blue-500',
              borderColor: 'border-blue-200',
            },
            {
              id: 'section-broken-links',
              icon: <Target className="h-3 w-3" />,
              label: 'Broken Links',
              iconColor: 'text-red-500',
              borderColor: 'border-red-200',
            },
            {
              id: 'section-analytics',
              icon: <BarChart3 className="h-3 w-3" />,
              label: 'Analytics',
              iconColor: 'text-orange-500',
              borderColor: 'border-orange-200',
            },
            {
              id: 'section-schema-markup',
              icon: <FileText className="h-3 w-3" />,
              label: 'Schema Markup',
            },
            {
              id: 'section-pagespeed-insights',
              icon: <BarChart3 className="h-3 w-3" />,
              label: 'PageSpeed Insights',
              iconColor: 'text-yellow-500',
              borderColor: 'border-yellow-200',
            },
            {
              id: 'section-redirect-chain',
              icon: <FileText className="h-3 w-3" />,
              label: 'Redirect Chain',
            },
            {
              id: 'section-404-page-check',
              icon: <Target className="h-3 w-3" />,
              label: '404 Page Check',
              iconColor: 'text-red-500',
              borderColor: 'border-red-200',
            },
            {
              id: 'section-https-security',
              icon: <BarChart3 className="h-3 w-3" />,
              label: 'HTTPS Security',
              iconColor: 'text-green-500',
              borderColor: 'border-green-200',
            },
            {
              id: 'section-sitemap',
              icon: <BarChart3 className="h-3 w-3" />,
              label: 'Sitemap',
            },
            {
              id: 'section-www-resolve',
              icon: <BarChart3 className="h-3 w-3" />,
              label: 'WWW Resolve',
            },
            {
              id: 'section-inner-pages-meta-audit',
              icon: <FileText className="h-3 w-3" />,
              label: 'Inner Pages Meta Audit',
            },
          ].map((item) =>
            createNavButton(
              item.id,
              item.icon,
              item.label,
              item.iconColor,
              item.borderColor
            )
          )}
          {/* Sub-sections for Inner Pages Meta Audit */}
          <div className="pl-7 space-y-1">
            {[
              { id: 'sub-duplicate-titles', label: 'Duplicate Titles' },
              {
                id: 'sub-duplicate-descriptions',
                label: 'Duplicate Descriptions',
              },
              { id: 'sub-missing-titles', label: 'Missing Titles' },
              { id: 'sub-missing-descriptions', label: 'Missing Descriptions' },
              { id: 'sub-title-length-issues', label: 'Title Length Issues' },
              {
                id: 'sub-meta-description-length-issues',
                label: 'Meta Description Length Issues',
              },
              { id: 'sub-orphan-pages', label: 'Orphan Pages' },
            ].map((item) => (
              <button
                key={item.id}
                ref={(el) => (navButtonRefs.current[item.id] = el)}
                onClick={() => scrollToSection(item.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-lg transition-all text-xs ${
                  activeSection === item.id
                    ? 'bg-[hsl(var(--razor-primary))]/20 text-[hsl(var(--razor-primary))] font-medium'
                    : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectAuditReport;
