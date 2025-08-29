import React, { useEffect, useState } from 'react';
import {
  FileText,
  RefreshCw,
  Shield,
  CheckCircle,
  AlertCircle,
  Star,
  Rocket,
  Loader2,
  Award,
  Brain,
  User,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import {
  getArticleEEATReport,
  implementArticle,
} from '@/lib/services/topics.service';
import { toast } from '@/components/ui/use-toast';
import { useSessionStore } from '@/lib/store/session-store';

interface ArticleAuditProps {
  articleId: string;
  locked?: boolean;
  onImplementSuccess?: (markdown: string) => void;
  onSessionChange?: () => void; // Callback for when session ID changes
}

interface EEATScore {
  category:
    | 'experience'
    | 'expertise'
    | 'authoritativeness'
    | 'trustworthiness';
  score: number;
  maxScore: number;
  feedback: string[];
  suggestions: string[];
}

interface EEATReport {
  id: string;
  overallScore: number;
  maxOverallScore: number;
  scores: EEATScore[];
  generatedAt: string;
  status: 'analyzing' | 'completed' | 'failed';
}

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
      return 'text-blue-600';
    case 'expertise':
      return 'text-purple-600';
    case 'authoritativeness':
      return 'text-yellow-600';
    case 'trustworthiness':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};

const getProgressScoreColor = (score: number, maxScore: number) => {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return 'text-green-600';
  if (percentage >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

export const ArticleAuditReport: React.FC<
  ArticleAuditProps & { editorContent: string }
> = ({
  articleId,
  locked = false,
  editorContent,
  onImplementSuccess,
  onSessionChange,
}) => {
  const [eeATReport, setEEATReport] = useState<EEATReport | null>(null);
  const [auditReportLoading, setAuditReportLoading] = useState(false);
  const [auditReportError, setAuditReportError] = useState<string | null>(null);
  const [implementLoading, setImplementLoading] = useState(false);
  const { initSession } = useSessionStore();

  const generateEEATReport = async (refresh = false) => {
    setAuditReportLoading(true);
    setAuditReportError(null);
    try {
      const response = await getArticleEEATReport(articleId, refresh);
      console.log('EEAT report response:', response);

      if (response.status && response.data) {
        console.log('response.data', response.data);

        setEEATReport(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch EEAT report');
      }
    } catch (err: any) {
      console.error('EEAT report error:', err);
    } finally {
      setAuditReportLoading(false);
    }
  };

  const handleImplementReport = async () => {
    if (!eeATReport || !editorContent) {
      console.log('Missing auditReport or editorContent, cannot implement');
      return;
    }

    setImplementLoading(true);

    try {
      initSession();
      const result = await implementArticle(
        articleId,
        JSON.stringify(eeATReport),
        editorContent
      );
      toast({
        title: 'Implement Success',
        description: 'Article generated successfully!',
      });

      // Call onSessionChange to trigger version refresh
      if (onSessionChange) {
        onSessionChange();
      }

      if (onImplementSuccess) {
        onImplementSuccess(result);
      }
    } catch (err: any) {
      console.error('Implement error:', err);
      toast({
        title: 'Implement Error',
        description: err.message || 'Failed to implement article',
        variant: 'destructive',
      });
    } finally {
      setImplementLoading(false);
    }
  };

  useEffect(() => {
    if (articleId) {
      generateEEATReport();
    }
  }, [articleId]);

  return (
    <div className="p-6 bg-white rounded-xl shadow-md w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="text-indigo-500" />
          <h2 className="text-2xl font-bold">Audit Report</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateEEATReport(true)}
            disabled={auditReportLoading || !locked}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={auditReportLoading ? 'animate-spin' : ''}
              size={18}
            />
            Regenerate EEAT
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImplementReport}
            disabled={auditReportLoading || !locked || implementLoading}
            className="flex items-center gap-2"
          >
            {implementLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Rocket size={18} />
            )}
            Implement
          </Button>
        </div>
      </div>

      {!locked ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">
            Click "Get EEAT Analysis" to generate a comprehensive analysis
          </h3>
          <p className="text-muted-foreground mb-6">
            This will analyze the content for Experience, Expertise,
            Authoritativeness, and Trustworthiness
          </p>
          <Button
            onClick={() => generateEEATReport(true)}
            className="razor-gradient"
            disabled={auditReportLoading || !locked}
          >
            {auditReportLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating EEAT Analysis...
              </>
            ) : (
              <>
                <Award className="h-4 w-4 mr-2" />
                Get EEAT Analysis
              </>
            )}
          </Button>
          {auditReportError && (
            <div className="text-center py-4 text-destructive">
              {auditReportError}
            </div>
          )}
        </div>
      ) : eeATReport ? (
        // EEAT Report Display
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Award className="h-6 w-6 text-yellow-600" />
                EEAT Analysis Results
              </h3>
              <Badge variant="outline" className="text-sm">
                {eeATReport.status === 'completed'
                  ? 'Completed'
                  : eeATReport.status}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="text-3xl font-bold text-gray-900">
                {eeATReport.overallScore}/{eeATReport.maxOverallScore}
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">
                  Overall EEAT Score
                </div>
                <Progress
                  value={
                    (eeATReport.overallScore / eeATReport.maxOverallScore) * 100
                  }
                  className="h-3"
                />
              </div>
              <div className="text-sm text-gray-500">
                {Math.round(
                  (eeATReport.overallScore / eeATReport.maxOverallScore) * 100
                )}
                %
              </div>
            </div>
          </div>

          {/* Category Scores */}
          <div className="grid gap-4">
            {eeATReport.scores.map((score) => {
              const Icon = getCategoryIcon(score.category);
              const percentage = (score.score / score.maxScore) * 100;

              return (
                <div
                  key={score.category}
                  className="bg-white border rounded-lg p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-6 w-6 ${getCategoryColor(
                          score.category
                        )}`}
                      />
                      <h4 className="text-lg font-semibold capitalize">
                        {score.category}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-bold ${getProgressScoreColor(
                          score.score,
                          score.maxScore
                        )}`}
                      >
                        {score.score}/{score.maxScore}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({Math.round(percentage)}%)
                      </span>
                    </div>
                  </div>

                  <Progress value={percentage} className="h-2 mb-4" />

                  {/* Feedback */}
                  {score.feedback.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-700">
                          Strengths:
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {score.feedback.map((item, index) => (
                          <li
                            key={`feedback-${score.category}-${index}`}
                            className="text-sm text-gray-700 flex items-start gap-2"
                          >
                            <span className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggestions */}
                  {score.suggestions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-700">
                          Improvements:
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {score.suggestions.map((item, index) => (
                          <li
                            key={`suggestion-${score.category}-${index}`}
                            className="text-sm text-gray-700 flex items-start gap-2"
                          >
                            <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Generated At */}
          <div className="text-center text-sm text-gray-500">
            Generated on {new Date(eeATReport.generatedAt).toLocaleString()}
          </div>
        </div>
      ) : (
        // Old format with sections and recommendations
        <></>
      )}
    </div>
  );
};

export default ArticleAuditReport;
