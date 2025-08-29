import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ExportToExcel,
  ExportToExcelHandle,
} from '@/components/ui/ExportToExcel';
import ImplementMergeModal from '@/components/article/ImplementMergeModal';
import {
  Award,
  Brain,
  Shield,
  Star,
  User,
  Play,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Download,
  Loader2,
} from 'lucide-react';
import { EEATReport } from '../../types';
import {
  getArticleEEATReport,
  implementArticle,
} from '@/lib/services/topics.service';
import { useParams } from 'react-router-dom';
import useEditor from '../../hooks/useEditor';
import { toast } from '@/hooks/use-toast';

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'experience':
      return User;
    case 'expertise':
      return Brain;
    case 'authoritativeness':
      return Award;
    case 'trustworthiness':
      return Shield;
    default:
      return Star;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'experience':
      return 'text-blue-600 dark:text-blue-400';
    case 'expertise':
      return 'text-purple-600 dark:text-purple-400';
    case 'authoritativeness':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'trustworthiness':
      return 'text-green-600 dark:text-green-400';
    default:
      return 'text-muted-foreground';
  }
};

const getScoreColor = (score: number, maxScore: number) => {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return 'text-green-600 dark:text-green-400';
  if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return CheckCircle;
    case 'analyzing':
      return RefreshCw;
    case 'failed':
      return XCircle;
    default:
      return AlertCircle;
  }
};

export const EEATSection: React.FC = () => {
  const { articleId } = useParams();
  const { editorRef } = useEditor();

  const [report, setReport] = useState<EEATReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [generatedBlocks, setGeneratedBlocks] = useState<any[]>([]);
  const [isImplementing, setIsImplementing] = useState(false);
  const exportRef = useRef<ExportToExcelHandle>(null);

  const fetchEEATReport = async (refresh = false) => {
    if (!articleId) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await getArticleEEATReport(articleId, refresh);

      if (response.status && response.data) {
        const reportData: EEATReport = {
          id: response.data.id,
          overallScore: response.data.overallScore,
          maxOverallScore: response.data.maxOverallScore,
          scores: response.data.scores,
          generatedAt: new Date(response.data.generatedAt),
          status: response.data.status,
        };
        setReport(reportData);
      } else if (response.status && !response.data) {
        // API succeeded but no data means audit hasn't been generated yet
        setReport(null);
        setError(null);
      } else {
        throw new Error(response.message || 'Failed to fetch EEAT report');
      }
    } catch (err: any) {
      console.error('Error fetching EEAT report:', err);
      setError(err.message || 'Failed to fetch EEAT report');
      setReport(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchEEATReport();
  }, [articleId]);

  const handleAnalyze = () => {
    fetchEEATReport(true);
  };

  const generateImprovedContent = async (suggestions: string[]) => {
    if (!articleId || !report) {
      throw new Error('Missing article ID or EEAT report');
    }

    // Get current blocks from editor
    const blocksToImprove = editorRef?.current?.document || [];

    try {
      // Prepare the audit report data for the API
      const auditReportData = {
        overallScore: report.overallScore,
        maxOverallScore: report.maxOverallScore,
        scores: report.scores,
        suggestions: suggestions,
        generatedAt: report.generatedAt.toISOString(),
        status: report.status,
      };

      // Prepare the editor content as JSON string
      const editorContentString = JSON.stringify(blocksToImprove);

      // Call the implementArticle API
      const improvedContentString = await implementArticle(
        articleId,
        JSON.stringify(auditReportData),
        editorContentString
      );

      // Parse the improved content back to blocks
      try {
        const improvedBlocks = JSON.parse(improvedContentString);

        // Ensure the improved blocks have the correct structure
        if (Array.isArray(improvedBlocks)) {
          return improvedBlocks.map((block: any, index: number) => ({
            ...block,
            id: block.id || `improved-${index}-${Date.now()}`, // Ensure each block has an ID
          }));
        } else {
          throw new Error('API returned invalid block structure');
        }
      } catch (parseError) {
        console.error('Failed to parse improved content:', parseError);

        // Fallback: treat the response as markdown and convert to blocks
        const fallbackBlocks = improvedContentString
          .split('\n\n')
          .filter((paragraph) => paragraph.trim())
          .map((paragraph, index) => {
            const trimmed = paragraph.trim();

            // Check if it's a heading
            if (trimmed.startsWith('#')) {
              const level = (trimmed.match(/^#+/) || [''])[0].length;
              const text = trimmed.replace(/^#+\s*/, '');
              return {
                id: `heading-${index}-${Date.now()}`,
                type: 'heading',
                props: { level: Math.min(level, 3) },
                content: [{ type: 'text', text, styles: {} }],
              };
            } else {
              // Regular paragraph
              return {
                id: `paragraph-${index}-${Date.now()}`,
                type: 'paragraph',
                props: {},
                content: [{ type: 'text', text: trimmed, styles: {} }],
              };
            }
          });

        return fallbackBlocks;
      }
    } catch (apiError) {
      console.error(
        'API call failed, using fallback implementation:',
        apiError
      );
      return null;
    }
  };

  const handleImplementSuggestions = async (category: string) => {
    if (!report || !editorRef?.current) {
      console.warn(
        'Cannot implement suggestions: missing report or update handler/editor reference'
      );
      return;
    }

    setIsImplementing(true);

    try {
      // Collect all suggestions from all categories or specific category
      let allSuggestions: string[] = [];

      if (category === 'all') {
        allSuggestions = report.scores.flatMap((score) => score.suggestions);
      } else {
        const categoryScore = report.scores.find(
          (score) => score.category === category
        );
        allSuggestions = categoryScore?.suggestions || [];
      }

      if (allSuggestions.length === 0) {
        console.warn('No suggestions found to implement');
        return;
      }

      // Generate improved content based on suggestions
      const improved = await generateImprovedContent(allSuggestions);
      if (improved) {
        setGeneratedBlocks(improved);
        setShowMergeModal(true);
      } else {
        toast({
          title: 'Error',
          description: 'There is some server error to implement EEAT report',
        });
      }
    } catch (error) {
      console.error('Error implementing suggestions:', error);
    } finally {
      setIsImplementing(false);
    }
  };

  const handleMergeApply = (mergedBlocks: any[]) => {
    if (editorRef?.current) {
      try {
        editorRef.current.replaceBlocks(
          editorRef.current.document,
          mergedBlocks
        );
      } catch (error) {
        console.error('Failed to update editor blocks:', error);
      }
    }
    setShowMergeModal(false);
    setGeneratedBlocks([]);
  };

  const getExportData = () => {
    if (!report) return [];

    const overallPercentage = (
      (report.overallScore / report.maxOverallScore) *
      100
    ).toFixed(1);

    return [
      {
        category: 'Overall Score',
        score: report.overallScore,
        maxScore: report.maxOverallScore,
        percentage: `${overallPercentage}%`,
        strengths: 'N/A',
        improvements: 'N/A',
        status: report.status,
        generatedAt: report.generatedAt.toLocaleDateString(),
      },
      ...report.scores.map((score) => ({
        category:
          score.category.charAt(0).toUpperCase() + score.category.slice(1),
        score: score.score,
        maxScore: score.maxScore,
        percentage: `${((score.score / score.maxScore) * 100).toFixed(1)}%`,
        strengths: score.feedback.join('; '),
        improvements: score.suggestions.join('; '),
        status: report.status,
        generatedAt: report.generatedAt.toLocaleDateString(),
      })),
    ];
  };

  const exportColumns = [
    { header: 'Category', accessor: 'category' },
    { header: 'Score', accessor: 'score' },
    { header: 'Max Score', accessor: 'maxScore' },
    { header: 'Percentage', accessor: 'percentage' },
    { header: 'Strengths', accessor: 'strengths' },
    { header: 'Improvements', accessor: 'improvements' },
    { header: 'Status', accessor: 'status' },
    { header: 'Generated At', accessor: 'generatedAt' },
  ];

  const handleExportReport = () => {
    exportRef.current?.exportNow();
  };

  if (!report && !isAnalyzing && !error) {
    return (
      <div className="p-3 space-y-4">
        <div className="text-center space-y-4">
          <Award className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-semibold text-lg">EEAT Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Article audit not generated right now. Analyze your article for
              Experience, Expertise, Authoritativeness, and Trustworthiness.
            </p>
          </div>
          <Button onClick={handleAnalyze} disabled={isAnalyzing}>
            <Play className="h-4 w-4 mr-2" />
            Start Analysis
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 space-y-4">
        <div className="text-center space-y-4">
          <XCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto" />
          <div>
            <h3 className="font-semibold text-lg">Analysis Failed</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button onClick={handleAnalyze} disabled={isAnalyzing}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isAnalyzing && !report) {
    return (
      <div className="p-3 space-y-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Analyzing Article</h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we analyze your article for EEAT criteria...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const StatusIcon = getStatusIcon(report.status);
  const overallPercentage =
    (report.overallScore / report.maxOverallScore) * 100;

  return (
    <div className="p-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <h3 className="font-semibold">EEAT Analysis</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Overall Score */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Overall Score</CardTitle>
            <div className="flex items-center gap-2">
              <StatusIcon
                className={`h-4 w-4 ${
                  report.status === 'completed'
                    ? 'text-green-600 dark:text-green-400'
                    : report.status === 'analyzing'
                    ? 'text-blue-600 dark:text-blue-400 animate-spin'
                    : 'text-red-600 dark:text-red-400'
                }`}
              />
              <Badge
                variant={
                  report.status === 'completed'
                    ? 'default'
                    : report.status === 'analyzing'
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {report.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span
                className={`text-2xl font-bold ${getScoreColor(
                  report.overallScore,
                  report.maxOverallScore
                )}`}
              >
                {report.overallScore}/{report.maxOverallScore}
              </span>
              <span className="text-sm text-muted-foreground">
                {overallPercentage.toFixed(0)}%
              </span>
            </div>
            <Progress value={overallPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Category Scores */}
      <div className="space-y-3">
        {report.scores.map((score) => {
          const Icon = getCategoryIcon(score.category);
          const percentage = (score.score / score.maxScore) * 100;

          return (
            <Card key={score.category}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`h-4 w-4 ${getCategoryColor(score.category)}`}
                    />
                    <CardTitle className="text-sm capitalize">
                      {score.category}
                    </CardTitle>
                  </div>
                  <span
                    className={`text-sm font-semibold ${getScoreColor(
                      score.score,
                      score.maxScore
                    )}`}
                  >
                    {score.score}/{score.maxScore}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={percentage} className="h-1" />

                {/* Feedback */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-green-700 dark:text-green-400">
                    Strengths:
                  </h4>
                  <ul className="space-y-1">
                    {score.feedback.map((item, index) => (
                      <li
                        key={`feedback-${score.category}-${index}`}
                        className="text-xs text-muted-foreground flex items-start gap-1"
                      >
                        <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggestions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium text-blue-700 dark:text-blue-400">
                      Improvements:
                    </h4>
                  </div>
                  <ul className="space-y-1">
                    {score.suggestions.map((item, index) => (
                      <li
                        key={`suggestion-${score.category}-${index}`}
                        className="text-xs text-muted-foreground flex items-start gap-1"
                      >
                        <AlertCircle className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <Button
          className="w-full"
          onClick={() => handleImplementSuggestions('all')}
          disabled={isImplementing || !editorRef?.current}
        >
          {isImplementing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          {isImplementing ? 'Implementing...' : 'Implement All Suggestions'}
        </Button>
        <ExportToExcel
          ref={exportRef}
          columns={exportColumns}
          data={getExportData()}
          filename={`eeat-report-${articleId}-${
            new Date().toISOString().split('T')[0]
          }.xlsx`}
        >
          <Button
            variant="outline"
            className="w-full mt-3"
            onClick={handleExportReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </ExportToExcel>
      </div>

      {/* Implement Merge Modal */}
      <ImplementMergeModal
        open={showMergeModal}
        onOpenChange={setShowMergeModal}
        currentBlocks={editorRef?.current?.document || []}
        generatedBlocks={generatedBlocks}
        onApply={handleMergeApply}
      />
    </div>
  );
};
