import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  History,
  Eye,
  RotateCcw,
  Clock,
  Loader2,
  GitBranch,
  ArrowLeft,
} from 'lucide-react';
import {
  getArticleEditorVersions,
  getArticleEditorContentByVersion,
  ArticleEditorVersion,
} from '@/lib/services/topics.service';
import api from '@/lib/api';
import { useParams } from 'react-router-dom';
import { useSessionStore } from '@/lib/store/session-store';
import { formatTimeAgo } from '@/lib/utils/dateFormat';
import ArticleVersionHistory from '@/components/article/ArticleVersionHistory';
import useEditor from '../../hooks/useEditor';

interface DocumentVersion {
  id: string;
  version: string;
  title: string;
  createdAt: Date;
  author: {
    name: string;
    avatar?: string;
    initials: string;
  };
  wordCount: number;
  changes: string;
  isCurrent: boolean;
}

export const VersionHistorySection: React.FC = () => {
  const { articleId } = useParams();
  const { sessionId } = useSessionStore();
  const { editorRef, setPreviewMode: setContextPreviewMode } = useEditor();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<DocumentVersion | null>(
    null
  );
  const [originalContent, setOriginalContent] = useState<string>('');

  const fetchVersions = async () => {
    if (!articleId) return;

    try {
      setLoading(true);
      setError(null);
      const apiVersions: ArticleEditorVersion[] =
        await getArticleEditorVersions(articleId);

      // Map API versions to local DocumentVersion type
      const mappedVersions: DocumentVersion[] = apiVersions.map((v, idx) => {
        const authorName = v.updated_by
          ? `${v.updated_by.firstname || ''} ${
              v.updated_by.lastname || ''
            }`.trim()
          : 'Unknown';

        const authorInitials = v.updated_by
          ? `${v.updated_by.firstname?.[0] || ''}${
              v.updated_by.lastname?.[0] || ''
            }`.toUpperCase()
          : 'U';

        return {
          id: `v${v.version}`,
          version: `v${v.version}`,
          title: idx === 0 ? 'Current Version' : `Version ${v.version}`,
          createdAt: new Date(v.updated_at),
          author: {
            name: authorName || 'Unknown',
            avatar: v.updated_by?.profile_image || undefined,
            initials: authorInitials || 'U',
          },
          wordCount: 0, // Word count not available in API response
          changes:
            idx === 0 ? 'Latest changes' : `Changes in version ${v.version}`,
          isCurrent: idx === 0, // Assume first version is current
        };
      });

      setVersions(mappedVersions);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch version history');
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch version history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [articleId]);

  // Cleanup preview mode when component unmounts or article changes
  useEffect(() => {
    return () => {
      if (previewMode) {
        setContextPreviewMode(false); // Clear in editor context
      }
    };
  }, [previewMode, setContextPreviewMode]);

  // Reset preview mode when article changes
  useEffect(() => {
    if (previewMode) {
      exitPreviewMode();
    }
  }, [articleId]);

  const handlePreview = async (version: DocumentVersion) => {
    if (!editorRef?.current) {
      toast({
        title: 'Error',
        description: 'Editor not available',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Store original content only if not already in preview mode
      if (!previewMode) {
        const currentContent = editorRef.current.document;
        setOriginalContent(JSON.stringify(currentContent));
      }

      // Load version content
      const versionNumber = parseInt(version.id.replace('v', ''));
      const data = await getArticleEditorContentByVersion(
        articleId ?? '',
        versionNumber
      );

      // Convert Buffer data to string using TextDecoder (browser-safe)
      let content = '';
      if (data.snapshot_data && data.snapshot_data.data) {
        const buffer = new Uint8Array(data.snapshot_data.data);
        content = new TextDecoder().decode(buffer);
      }

      // Enable preview mode and make editor read-only FIRST
      setPreviewMode(true);
      setPreviewVersion(version);
      setContextPreviewMode(true, version.version); // Set in editor context BEFORE content change

      // Parse and set the version content in editor
      if (content) {
        const versionBlocks = JSON.parse(content);
        editorRef.current.replaceBlocks(
          editorRef.current.document,
          versionBlocks
        );
      }

      toast({
        title: previewMode ? 'Preview Switched' : 'Preview Mode',
        description: `Viewing ${version.version} - Editor is now read-only`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to load version content',
        variant: 'destructive',
      });
    }
  };

  const exitPreviewMode = () => {
    if (!editorRef?.current) return;

    try {
      // Restore original content
      if (originalContent) {
        const originalBlocks = JSON.parse(originalContent);
        editorRef.current.replaceBlocks(
          editorRef.current.document,
          originalBlocks
        );
      }

      setPreviewMode(false);
      setPreviewVersion(null);
      setOriginalContent('');
      setContextPreviewMode(false); // Clear in editor context

      toast({
        title: 'Preview Exited',
        description: 'Editor is now editable again',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to restore original content',
        variant: 'destructive',
      });
    }
  };

  const handleRestore = async (version: DocumentVersion) => {
    if (!sessionId) {
      toast({
        title: 'Error',
        description: 'Session ID is required to restore version',
        variant: 'destructive',
      });
      return;
    }

    try {
      const versionNumber = parseInt(version.id.replace('v', ''));
      await api.post(
        `/article-documents/${articleId}/versions/${versionNumber}/restore`,
        { session_id: sessionId }
      );

      toast({
        title: 'Version Restored',
        description: `Document restored to ${version.version}`,
      });

      // Refresh versions and notify parent component
      await fetchVersions();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to restore version',
        variant: 'destructive',
      });
    }
  };

  const handleVersionHistoryFinish = (_publishUrl: string) => {
    // Handle any post-version history actions if needed
    setShowVersionHistory(false);
    // Exit preview mode if active
    if (previewMode) {
      exitPreviewMode();
    }
    // Refresh versions after any changes
    fetchVersions();
  };

  if (loading) {
    return (
      <div className="p-3 space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium">Version History</span>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium">Version History</span>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <History className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-xs text-muted-foreground">
            Failed to load versions
          </p>
          <p className="text-xs text-muted-foreground/70">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={fetchVersions}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4">
      {/* Preview Mode Banner */}
      {previewMode && previewVersion && (
        <div className="bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Preview Mode: {previewVersion.version}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={exitPreviewMode}
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Exit Preview
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
            <Avatar className="h-3 w-3">
              <AvatarImage
                src={previewVersion.author.avatar || '/placeholder.svg'}
                alt={previewVersion.author.name}
              />
              <AvatarFallback className="text-[8px]">
                {previewVersion.author.initials}
              </AvatarFallback>
            </Avatar>
            <span>
              {previewVersion.author.name} •{' '}
              {formatTimeAgo(previewVersion.createdAt)}
            </span>
          </div>
          <p className="text-xs text-blue-600">
            Editor is read-only. Click "Exit Preview" to return to editing mode.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium">Version History</span>
            <span className="text-xs text-muted-foreground">
              ({versions.length})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setShowVersionHistory(true)}
            disabled={previewMode}
          >
            <GitBranch className="h-3 w-3 mr-1" />
            View All
          </Button>
        </div>
      </div>

      {/* Version List */}
      <div className="space-y-1">
        {versions.map((version) => (
          <div
            key={version.id}
            className={`group p-2 rounded-md border transition-colors ${
              version.isCurrent
                ? 'bg-blue-50/50 border-blue-200/50 dark:bg-blue-950/30 dark:border-blue-900/50'
                : 'bg-card hover:bg-accent/50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant={version.isCurrent ? 'default' : 'secondary'}
                  className="text-xs px-1 py-0 h-4"
                >
                  {version.version}
                </Badge>
                {version.isCurrent && (
                  <Badge
                    variant="outline"
                    className="text-xs px-1 py-0 h-4 text-green-700 border-green-200 bg-green-50 dark:text-green-300 dark:border-green-900 dark:bg-green-950"
                  >
                    Current
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-5 w-5 p-0 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-300 ${
                    previewMode && previewVersion?.id === version.id
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300'
                      : ''
                  }`}
                  onClick={() => handlePreview(version)}
                  title={
                    previewMode && previewVersion?.id === version.id
                      ? 'Currently previewing this version'
                      : 'Preview version'
                  }
                >
                  <Eye className="h-2.5 w-2.5" />
                </Button>
                {!version.isCurrent && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-950 dark:hover:text-green-300"
                      onClick={() => handleRestore(version)}
                      disabled={previewMode}
                      title={
                        previewMode
                          ? 'Exit preview mode first'
                          : 'Restore version'
                      }
                    >
                      <RotateCcw className="h-2.5 w-2.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium truncate">
                  {version.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {version.wordCount > 0
                    ? `${version.wordCount} words`
                    : 'No word count'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="truncate">{version.changes}</span>
                <div className="flex items-center gap-1 ml-2">
                  <Clock className="h-2 w-2" />
                  <span>{formatTimeAgo(version.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-4 w-4">
                  <AvatarImage
                    src={version.author.avatar || '/placeholder.svg'}
                    alt={version.author.name}
                  />
                  <AvatarFallback className="text-xs text-[8px]">
                    {version.author.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {version.author.name}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {versions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <History className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-xs text-muted-foreground">No version history</p>
          <p className="text-xs text-muted-foreground/70">
            Versions will appear here as you save
          </p>
        </div>
      )}

      {/* Article Version History Modal */}
      {articleId && (
        <ArticleVersionHistory
          open={showVersionHistory}
          onOpenChange={setShowVersionHistory}
          articleId={articleId}
          onFinish={handleVersionHistoryFinish}
        />
      )}
    </div>
  );
};
