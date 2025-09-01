import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Eye, GitBranch, History, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { formatTimestamp } from '@/utils/time.util';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import BlockRenderer from '../ui/BlockRenderer';
import { Badge } from '../ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import {
  ArticleEditorVersion,
  getArticleEditorContentByVersion,
  getArticleEditorVersions,
} from '@/lib/services/topics.service';
import { diffBlocksByStructure } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { useSessionStore } from '@/lib/store/session-store';

interface ArticleVersionsModelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
  onFinish: (publishUrl: string) => void;
}

interface Version {
  _id: string;
  content: string;
  timestamp: Date;
  author: {
    name: string;
    avatar?: string;
    initials: string;
  };
  label: string;
  isCurrent: boolean;
  changesSummary: string;
}

const ArticleVersionHistory: React.FC<ArticleVersionsModelProps> = ({
  open,
  onOpenChange,
  articleId,
}: ArticleVersionsModelProps) => {
  const { sessionId } = useSessionStore();
  const [versions, setVersions] = useState<Version[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareContents, setCompareContents] = useState<{
    left: string;
    right: string;
  } | null>(null);

  //compare
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [selectedVersion1, setSelectedVersion1] = useState<Version | null>(
    null
  );
  const [selectedVersion2, setSelectedVersion2] = useState<Version | null>(
    null
  );

  //preview
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const fetchVersions = async () => {
    if (!articleId) return;
    try {
      const apiVersions: ArticleEditorVersion[] =
        await getArticleEditorVersions(articleId);
      // Map API versions to local Version type
      const mappedVersions = apiVersions.map((v, idx) => ({
        _id: `v${v.version}`,
        content: '', // Content not included in version list, only metadata
        timestamp: new Date(v.updated_at),
        author: v.updated_by
          ? {
              name:
                `${v.updated_by.firstname || ''} ${
                  v.updated_by.lastname || ''
                }`.trim() || 'Unknown',
              avatar: v.updated_by.profile_image || undefined,
              initials:
                `${v.updated_by.firstname?.[0] || ''}${
                  v.updated_by.lastname?.[0] || ''
                }`.toUpperCase() || 'U',
            }
          : {
              name: 'Unknown',
              avatar: undefined,
              initials: 'U',
            },
        label: `Version ${v.version}`,
        isCurrent: idx === 0, // Assume first is current
        changesSummary: '', // Optionally fill if API provides
      }));
      setVersions(mappedVersions);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch version history',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  useEffect(() => {
    async function fetchCompareContents() {
      if (compareMode && selectedVersion1 && selectedVersion2) {
        setCompareLoading(true);
        setCompareError(null);
        try {
          const [data1, data2] = await Promise.all([
            getArticleEditorContentByVersion(
              articleId,
              parseInt(selectedVersion1._id.replace('v', ''))
            ),
            getArticleEditorContentByVersion(
              articleId,
              parseInt(selectedVersion2._id.replace('v', ''))
            ),
          ]);
          let left = '',
            right = '';
          if (data1.snapshot_data && data1.snapshot_data.data) {
            left = new TextDecoder().decode(
              new Uint8Array(data1.snapshot_data.data)
            );
          }
          if (data2.snapshot_data && data2.snapshot_data.data) {
            right = new TextDecoder().decode(
              new Uint8Array(data2.snapshot_data.data)
            );
          }
          setCompareContents({ left, right });
        } catch (err: any) {
          setCompareError(err.message || 'Failed to fetch version contents');
          setCompareContents(null);
        } finally {
          setCompareLoading(false);
        }
      } else {
        setCompareContents(null);
      }
    }
    fetchCompareContents();
  }, [compareMode, selectedVersion1, selectedVersion2, articleId]);

  const handleViewVersion = async (version: Version) => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const data = await getArticleEditorContentByVersion(
        articleId,
        parseInt(version._id.replace('v', ''))
      );
      // Convert Buffer data to string using TextDecoder (browser-safe)
      let content = '';
      if (data.snapshot_data && data.snapshot_data.data) {
        const buffer = new Uint8Array(data.snapshot_data.data);
        content = new TextDecoder().decode(buffer);
      }
      setPreviewContent(content);
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to fetch version content');
      setPreviewContent('');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRestoreVersion = async (version: Version) => {
    if (!articleId || !sessionId) {
      toast({
        title: 'Error',
        description: 'Missing article or session information.',
        variant: 'destructive',
      });
      return;
    }
    try {
      // Extract version number from id (e.g., v8 -> 8)
      const versionNumber = parseInt(version._id.replace('v', ''));
      await api.post(
        `/article-documents/${articleId}/versions/${versionNumber}/restore`,
        { session_id: sessionId }
      );
      toast({
        title: 'Version Restored',
        description: `Restored to ${version.label} successfully.`,
      });

      onOpenChange(false);
      fetchVersions();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to restore version',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Version History
              </DialogTitle>
              <DialogDescription>
                View and manage all versions of this article. Click on any
                version to view its content or revert to it.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCompareMode(!compareMode)}
                variant={compareMode ? 'default' : 'outline'}
                size="sm"
              >
                <GitBranch className="h-4 w-4 mr-2" />
                {compareMode ? 'Exit Compare' : 'Compare Versions'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {compareMode ? (
          // Compare Mode
          <div className="space-y-4 h-[70vh] min-h-0 flex flex-col">
            {/* Version Selectors */}
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Compare:</label>
                <Select
                  value={selectedVersion1?._id}
                  onValueChange={(id) =>
                    setSelectedVersion1(
                      versions.find((v) => v._id === id) || null
                    )
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select version 1" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((version) => (
                      <SelectItem key={version._id} value={version._id}>
                        {version.label} - {formatTimestamp(version.timestamp)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-muted-foreground">vs</span>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedVersion2?._id}
                  onValueChange={(id) =>
                    setSelectedVersion2(
                      versions.find((v) => v._id === id) || null
                    )
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select version 2" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((version) => (
                      <SelectItem key={version._id} value={version._id}>
                        {version.label} - {formatTimestamp(version.timestamp)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Side-by-side Comparison */}
            {selectedVersion1 &&
              selectedVersion2 &&
              (compareLoading ? (
                <div className="flex items-center justify-center flex-1 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : compareError ? (
                <div className="flex items-center justify-center flex-1 text-destructive">
                  {compareError}
                </div>
              ) : compareContents ? (
                (() => {
                  let leftBlocks: any[] = [];
                  let rightBlocks: any[] = [];
                  try {
                    leftBlocks = JSON.parse(compareContents.left);
                  } catch {}
                  try {
                    rightBlocks = JSON.parse(compareContents.right);
                  } catch {}
                  const diffed = diffBlocksByStructure(leftBlocks, rightBlocks);
                  return (
                    <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                      {/* Left Version */}
                      <div className="border rounded-lg overflow-hidden flex flex-col min-h-0">
                        <div className="bg-muted/50 p-3 border-b">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={
                                  selectedVersion1.author.avatar ||
                                  '/placeholder.svg'
                                }
                              />
                              <AvatarFallback className="text-xs">
                                {selectedVersion1.author.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {selectedVersion1.label}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {selectedVersion1.author.name} •{' '}
                                {formatTimestamp(selectedVersion1.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 flex-1 min-h-0 overflow-y-auto bg-card">
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <BlockRenderer
                              content={JSON.stringify(diffed.left)}
                            />
                          </div>
                        </div>
                      </div>
                      {/* Right Version */}
                      <div className="border rounded-lg overflow-hidden flex flex-col min-h-0">
                        <div className="bg-muted/50 p-3 border-b">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={
                                  selectedVersion2.author.avatar ||
                                  '/placeholder.svg'
                                }
                              />
                              <AvatarFallback className="text-xs">
                                {selectedVersion2.author.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {selectedVersion2.label}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {selectedVersion2.author.name} •{' '}
                                {formatTimestamp(selectedVersion2.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 flex-1 min-h-0 overflow-y-auto bg-card">
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <BlockRenderer
                              content={JSON.stringify(diffed.right)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-center justify-center flex-1 text-muted-foreground">
                  <div className="text-center">
                    <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select two versions to compare</p>
                  </div>
                </div>
              ))}
            {(!selectedVersion1 || !selectedVersion2) && (
              <div className="flex items-center justify-center flex-1 text-muted-foreground">
                <div className="text-center">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select two versions to compare</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Normal Timeline Mode
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
            {/* Timeline */}
            <div className="lg:col-span-1 border-r pr-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Timeline
              </h3>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {versions.map((version, index) => (
                  <div
                    key={`version-${version.label}-${index}`}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage
                        src={version.author.avatar || '/placeholder.svg'}
                      />
                      <AvatarFallback className="text-xs">
                        {version.author.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {version.label}
                        </span>
                        {version.isCurrent && (
                          <Badge
                            className="bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900"
                            variant="outline"
                          >
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {version.author.name}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {formatTimestamp(version.timestamp)}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {version.changesSummary}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => handleViewVersion(version)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {!version.isCurrent && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Revert
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Revert to {version.label}?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will restore the content from{' '}
                                  {version.label} and create a new version. Your
                                  current changes will be preserved in the
                                  version history.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRestoreVersion(version)}
                                  className="razor-gradient"
                                >
                                  Revert to Version
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Preview */}
            <div className="lg:col-span-2">
              <h3 className="font-semibold mb-4">Content Preview</h3>
              <div className="bg-muted/30 p-6 rounded-lg border h-[70vh] overflow-y-auto">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {previewLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : previewError ? (
                      <div className="text-center py-8 text-destructive">
                        {previewError}
                      </div>
                    ) : previewContent ? (
                      (() => {
                        let previewBlocks: any[] = [];
                        try {
                          previewBlocks = JSON.parse(previewContent);
                          if (!Array.isArray(previewBlocks))
                            throw new Error('Not an array');
                          return (
                            <BlockRenderer
                              content={JSON.stringify(previewBlocks)}
                            />
                          );
                        } catch {
                          return (
                            <div className="text-red-500 dark:text-red-400">
                              Invalid content format
                            </div>
                          );
                        }
                      })()
                    ) : (
                      'Select a version to view its content'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ArticleVersionHistory;
