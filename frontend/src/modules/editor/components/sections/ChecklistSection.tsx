import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  GripVertical,
  Loader2,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import api from '@/lib/api';
import useEditor from '../../hooks/useEditor';

interface ChecklistItem {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  score?: number;
  suggestions?: string[];
}

interface ChecklistItemWithCommand extends ChecklistItem {
  command?: string;
  enabled: boolean;
  isCustom?: boolean;
}

interface APICheckResponse {
  status: boolean;
  message: string;
  data: {
    fixed_version: string;
    passed: boolean;
  };
}

const defaultChecklistItems: ChecklistItemWithCommand[] = [
  {
    id: '1',
    name: 'Brevity',
    description: 'Omit needless words',
    status: 'pending',
    enabled: true,
    command: 'brevity',
  },
  {
    id: '2',
    name: 'Cliches',
    description: 'Replace over-used phrases',
    status: 'pending',
    enabled: true,
    command: 'cliches',
  },
  {
    id: '3',
    name: 'Readability',
    description: 'Simplify convoluted sentences',
    status: 'pending',
    enabled: false,
    command: 'readability',
  },
  {
    id: '4',
    name: 'Passive Voice',
    description: 'Convert passive voice to active voice',
    status: 'pending',
    enabled: false,
    command: 'passive_voice',
  },
  {
    id: '5',
    name: 'Confidence',
    description: 'Remove excessive hedging (I think, probably, etc)',
    status: 'pending',
    enabled: false,
    command: 'confidence',
  },
  {
    id: '6',
    name: 'Citation',
    description: 'Identify claims that need evidence',
    status: 'pending',
    enabled: false,
    command: 'citation',
  },
  {
    id: '7',
    name: 'Repetition',
    description: 'Remove repeated words',
    status: 'pending',
    enabled: false,
    command: 'repetition',
  },
];

const getStatusIcon = (status: ChecklistItem['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'running':
      return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

export const ChecklistSection: React.FC = () => {
  const { articleId } = useParams();
  const [items, setItems] = useState<ChecklistItemWithCommand[]>(
    defaultChecklistItems
  );
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customCheckName, setCustomCheckName] = useState('');
  const [customCheckCommand, setCustomCheckCommand] = useState('');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const { editorRef } = useEditor();

  // Track per-check pending issues and coordination for sequential flow
  const pendingCountsRef = useRef<Map<string, number>>(new Map());
  const currentCheckRef = useRef<string | null>(null);
  const waitResolversRef = useRef<Map<string, () => void>>(new Map());
  // Mirror of current running check for UI disabling
  const [currentCheckId, setCurrentCheckId] = useState<string | null>(null);
  // Track whether insertion/collection of issues is still in progress per check
  const insertionInProgressRef = useRef<Map<string, boolean>>(new Map());
  // Track early resolutions that happen before pending count has been established
  const earlyResolvedRef = useRef<Map<string, number>>(new Map());

  // Utility to generate stable-ish IDs for issue markers
  const generateId = () => 'iss-' + Math.random().toString(36).slice(2, 10);

  // Extract plain text from a single block
  const extractTextFromBlock = (block: any): string => {
    if (!Array.isArray(block?.content)) return '';
    let text = '';
    for (const node of block.content) {
      if (node.type === 'text' && typeof node.text === 'string') {
        text += node.text;
      }
    }
    return text;
  };

  // Call API to check text
  const callCheckAPI = async (
    checkType: string,
    text: string
  ): Promise<APICheckResponse> => {
    if (!articleId) {
      throw new Error('Article ID is required');
    }

    try {
      const response = await api.post(`/article-documents/${articleId}/check`, {
        check_type: checkType,
        text: text,
      });

      return response.data;
    } catch (error: any) {
      console.error('API check failed:', error);
      throw new Error(error.response?.data?.message || 'Check failed');
    }
  };

  // Find differences by comparing strings and identifying changed segments
  const findTextDifferences = (original: string, fixed: string) => {
    const differences: Array<{
      start: number;
      end: number;
      original: string;
      suggestion: string;
    }> = [];

    // Find the first point where they differ
    let diffStart = 0;
    while (
      diffStart < Math.min(original.length, fixed.length) &&
      original[diffStart] === fixed[diffStart]
    ) {
      diffStart++;
    }

    // If they're identical, return no differences
    if (diffStart === original.length && diffStart === fixed.length) {
      return differences;
    }

    // Find the last point where they differ (working backwards)
    let originalEnd = original.length;
    let fixedEnd = fixed.length;

    while (
      originalEnd > diffStart &&
      fixedEnd > diffStart &&
      original[originalEnd - 1] === fixed[fixedEnd - 1]
    ) {
      originalEnd--;
      fixedEnd--;
    }

    // Extract the different parts
    const originalPart = original.slice(diffStart, originalEnd);
    const fixedPart = fixed.slice(diffStart, fixedEnd);

    if (originalPart || fixedPart) {
      differences.push({
        start: diffStart,
        end: originalEnd,
        original: originalPart,
        suggestion: fixedPart,
      });
    }

    return differences;
  };

  // Insert issue markers based on API response differences
  const insertIssueMarkersForCheck = async (
    check: ChecklistItemWithCommand
  ): Promise<number> => {
    const bn = editorRef?.current;
    if (!bn) return 0;

    try {
      const blocksSnapshot = bn.document || [];
      let totalIssues = 0;

      for (const block of blocksSnapshot) {
        if (!Array.isArray(block.content)) {
          continue;
        }

        const originalText = extractTextFromBlock(block);
        if (!originalText.trim()) {
          continue;
        }

        let apiResponse: APICheckResponse | null = null;
        try {
          apiResponse = await callCheckAPI(
            check.command || 'grammar',
            originalText
          );
        } catch (err) {
          // Keep block unchanged on per-block API failure
          continue;
        }

        if (!apiResponse || apiResponse.data.passed) {
          continue;
        }

        const fixedText = apiResponse.data.fixed_version;
        const differences = findTextDifferences(originalText, fixedText);

        if (differences.length === 0) {
          continue;
        }

        let blockIssues = 0;
        let localCharPosition = 0;
        const newContent: any[] = [];

        for (const node of block.content) {
          if (node.type === 'text' && typeof node.text === 'string') {
            const text = node.text as string;
            const nodeStartPos = localCharPosition;
            const nodeEndPos = localCharPosition + text.length;

            const nodeDifferences = differences
              .filter(
                (diff) => diff.end > nodeStartPos && diff.start < nodeEndPos
              )
              .sort((a, b) => a.start - b.start);

            if (nodeDifferences.length === 0) {
              newContent.push(node);
            } else {
              let lastIndex = 0;
              for (const diff of nodeDifferences) {
                const overlapStartAbs = Math.max(diff.start, nodeStartPos);
                const overlapEndAbs = Math.min(diff.end, nodeEndPos);
                const relativeStart = overlapStartAbs - nodeStartPos;
                const relativeEnd = overlapEndAbs - nodeStartPos;

                if (relativeStart > lastIndex) {
                  newContent.push({
                    ...node,
                    text: text.slice(lastIndex, relativeStart),
                  });
                }

                const originalFragment = text.slice(relativeStart, relativeEnd);
                const suggestionSliceStart = overlapStartAbs - diff.start;
                const suggestionSliceEnd = overlapEndAbs - diff.start;
                const suggestionFragment = diff.suggestion.slice(
                  suggestionSliceStart,
                  suggestionSliceEnd
                );

                const issueId = generateId();
                blockIssues += 1;
                newContent.push({
                  type: 'issue',
                  props: {
                    issueId,
                    checkId: check.id,
                    kind: check.command || 'generic',
                    originalText: originalFragment,
                    suggestion: suggestionFragment,
                    message: `${check.name}: "${originalFragment}" → "${suggestionFragment}"`,
                  },
                });

                lastIndex = relativeEnd;
              }

              if (lastIndex < text.length) {
                newContent.push({
                  ...node,
                  text: text.slice(lastIndex),
                });
              }
            }

            localCharPosition += text.length;
          } else {
            newContent.push(node);
          }
        }

        totalIssues += blockIssues;
        if (blockIssues > 0) {
          // Apply immediately for this block
          const currentBlocks = bn.document || [];
          const newBlocks = currentBlocks.map((b: any) =>
            b.id === block.id ? { ...b, content: newContent } : b
          );
          bn.replaceBlocks(currentBlocks, newBlocks as any);
        }
      }

      return totalIssues;
    } catch (error: any) {
      console.error('Error inserting issue markers:', error);
      toast({
        title: 'Check Failed',
        description: error.message || 'Failed to run check',
        variant: 'destructive',
      });
      return 0;
    }
  };

  // Listen for issue resolution and drive sequential flow
  useEffect(() => {
    const onResolved = (e: Event) => {
      const ce = e as CustomEvent<{
        issueId: string;
        checkId: string;
        action: 'applied' | 'rejected';
      }>;
      const { checkId } = ce.detail;
      const hasPendingEntry = pendingCountsRef.current.has(checkId);
      const insertionInProgress = insertionInProgressRef.current.get(checkId);

      // If insertion is still happening or pending count not set yet, accumulate early resolutions
      if (!hasPendingEntry || insertionInProgress) {
        const prevEarly = earlyResolvedRef.current.get(checkId) ?? 0;
        earlyResolvedRef.current.set(checkId, prevEarly + 1);
        return;
      }

      const current = pendingCountsRef.current.get(checkId) ?? 0;
      const next = Math.max(0, current - 1);
      pendingCountsRef.current.set(checkId, next);
      // Only complete when there are no pending issues and insertion has finished
      if (
        next === 0 &&
        currentCheckRef.current === checkId &&
        insertionInProgressRef.current.get(checkId) === false
      ) {
        // finalize completion
        setItems((old) =>
          old.map((it) =>
            it.id === checkId
              ? {
                  ...it,
                  status: 'completed' as const,
                  score: 100,
                  suggestions: ['All issues addressed'],
                }
              : it
          )
        );
        setCurrentCheckId(null);
        const resolver = waitResolversRef.current.get(checkId);
        if (resolver) {
          waitResolversRef.current.delete(checkId);
          resolver();
        }
      }
    };
    window.addEventListener('issueResolved', onResolved as EventListener);
    return () =>
      window.removeEventListener('issueResolved', onResolved as EventListener);
  }, [setItems]);

  const waitForCheckCompletion = (checkId: string) =>
    new Promise<void>((resolve) => {
      waitResolversRef.current.set(checkId, resolve);
    });

  const runCheck = async (check: ChecklistItemWithCommand) => {
    // Mark running
    setItems((prev) =>
      prev.map((i) =>
        i.id === check.id ? { ...i, status: 'running' as const } : i
      )
    );
    currentCheckRef.current = check.id;
    setCurrentCheckId(check.id);

    try {
      // Insert markers
      insertionInProgressRef.current.set(check.id, true);
      const inserted = await insertIssueMarkersForCheck(check);
      // Account for any issues that were already resolved while inserting
      const early = earlyResolvedRef.current.get(check.id) ?? 0;
      const remaining = Math.max(0, inserted - early);
      pendingCountsRef.current.set(check.id, remaining);

      if (remaining === 0) {
        // Nothing to fix; complete immediately
        setItems((prev) =>
          prev.map((i) =>
            i.id === check.id
              ? {
                  ...i,
                  status: 'completed' as const,
                  score: 100,
                  suggestions: ['No issues found'],
                }
              : i
          )
        );
        // Clear running state since this check finished instantly
        currentCheckRef.current = null;
        setCurrentCheckId(null);
        insertionInProgressRef.current.set(check.id, false);
        earlyResolvedRef.current.delete(check.id);
        return;
      }

      // Mark insertion complete; now wait for resolutions
      insertionInProgressRef.current.set(check.id, false);
      // If after marking complete the remaining is zero, finalize immediately
      if (pendingCountsRef.current.get(check.id) === 0) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === check.id
              ? {
                  ...i,
                  status: 'completed' as const,
                  score: 100,
                  suggestions: ['All issues addressed'],
                }
              : i
          )
        );
        currentCheckRef.current = null;
        setCurrentCheckId(null);
        earlyResolvedRef.current.delete(check.id);
        return;
      }
      // Wait until all issues for this check are resolved
      await waitForCheckCompletion(check.id);
      // After completion, clear running state
      currentCheckRef.current = null;
      setCurrentCheckId(null);
      earlyResolvedRef.current.delete(check.id);
    } catch (error: any) {
      // Mark as failed
      setItems((prev) =>
        prev.map((i) =>
          i.id === check.id
            ? {
                ...i,
                status: 'failed' as const,
                suggestions: [error.message || 'Check failed'],
              }
            : i
        )
      );
      // Clear running state on failure as well
      currentCheckRef.current = null;
      setCurrentCheckId(null);
      insertionInProgressRef.current.set(check.id, false);
      earlyResolvedRef.current.delete(check.id);
    }
  };

  const runAllChecks = async () => {
    if (isRunningAll || currentCheckId !== null || !articleId) {
      if (!articleId) {
        toast({
          title: 'Error',
          description: 'Article ID is required to run checks',
          variant: 'destructive',
        });
      }
      return;
    }

    setIsRunningAll(true);

    const enabled = items.filter((i) => i.enabled);
    for (const check of enabled) {
      await runCheck(check);
    }

    setIsRunningAll(false);
  };

  const runSingleCheck = async (id: string) => {
    if (!articleId) {
      toast({
        title: 'Error',
        description: 'Article ID is required to run checks',
        variant: 'destructive',
      });
      return;
    }
    // Prevent starting another check while one is running
    if (currentCheckId && currentCheckId !== id) {
      toast({
        title: 'Please wait',
        description: 'Finish the current check before starting another.',
      });
      return;
    }

    const item = items.find((i) => i.id === id);
    if (!item?.enabled) return;
    await runCheck(item);
  };

  const toggleCheck = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const addCustomCheck = () => {
    if (!customCheckName.trim()) return;

    const newCheck: ChecklistItemWithCommand = {
      id: Date.now().toString(),
      name: customCheckName,
      description: `Custom check: ${customCheckName}`,
      status: 'pending',
      enabled: true,
      command:
        customCheckCommand ||
        customCheckName.toLowerCase().replace(/\s+/g, '_'),
      isCustom: true,
    };

    setItems((prev) => [...prev, newCheck]);
    setCustomCheckName('');
    setCustomCheckCommand('');
    setShowAddCustom(false);
  };

  const removeCustomCheck = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (!draggedItem) return;

    const draggedIndex = items.findIndex((item) => item.id === draggedItem);
    if (draggedIndex === -1 || draggedIndex === dropIndex) return;

    const newItems = [...items];
    const [draggedItemData] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, draggedItemData);

    setItems(newItems);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const enabledItems = items.filter((item) => item.enabled);
  const completedCount = enabledItems.filter(
    (item) => item.status === 'completed'
  ).length;
  const overallProgress =
    enabledItems.length > 0 ? (completedCount / enabledItems.length) * 100 : 0;

  return (
    <div className="p-3 space-y-3">
      {/* Header with Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Document Health</h3>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{enabledItems.length}
          </span>
        </div>
        <Progress value={overallProgress} className="h-1.5" />
      </div>

      {/* Run All Button */}
      <Button
        onClick={runAllChecks}
        disabled={
          isRunningAll ||
          currentCheckId !== null ||
          enabledItems.length === 0 ||
          !articleId
        }
        size="sm"
        className="w-full h-8"
      >
        {isRunningAll ? (
          <>
            <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
            Running...
          </>
        ) : !articleId ? (
          <>
            <Play className="h-3 w-3 mr-1.5" />
            Article ID Required
          </>
        ) : (
          <>
            <Play className="h-3 w-3 mr-1.5" />
            Run All ({enabledItems.length})
          </>
        )}
      </Button>

      {/* Individual Checks */}
      <div className="space-y-1">
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable={!(isRunningAll || currentCheckId !== null)}
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 p-2 rounded-md border transition-all cursor-move ${
              item.enabled
                ? 'bg-card hover:bg-accent/50'
                : 'bg-muted/30 opacity-60'
            } ${draggedItem === item.id ? 'opacity-50 scale-95' : ''} ${
              dragOverIndex === index && draggedItem !== item.id
                ? 'border-blue-400 bg-blue-50/50'
                : ''
            } ${
              isRunningAll || currentCheckId !== null
                ? 'cursor-not-allowed'
                : 'cursor-move'
            }`}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />

            {/* Checkbox */}
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={() => toggleCheck(item.id)}
              className="w-3 h-3 rounded border-2"
              disabled={isRunningAll || currentCheckId !== null}
              onClick={(e) => e.stopPropagation()}
            />

            <div className="flex items-center gap-2 flex-1 min-w-0">
              {item.enabled && getStatusIcon(item.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium truncate">
                    {item.name}
                  </span>
                  {item.score && (
                    <Badge
                      variant="secondary"
                      className="text-xs px-1 py-0 h-4"
                    >
                      {item.score}%
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {item.suggestions && item.suggestions.length > 0
                    ? item.suggestions[0]
                    : item.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {item.enabled && item.status === 'pending' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    runSingleCheck(item.id);
                  }}
                  disabled={
                    !articleId ||
                    isRunningAll ||
                    (currentCheckId !== null && currentCheckId !== item.id)
                  }
                  className="h-6 w-6 p-0"
                  title={!articleId ? 'Article ID required' : 'Run check'}
                >
                  <Play className="h-3 w-3" />
                </Button>
              )}

              {item.isCustom && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCustomCheck(item.id);
                  }}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  ×
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Check */}
      {showAddCustom ? (
        <div className="space-y-2 p-2 border rounded-md bg-muted/20">
          <Input
            placeholder="What should Lex check for?"
            value={customCheckName}
            onChange={(e) => setCustomCheckName(e.target.value)}
            className="h-7 text-xs"
          />
          <Input
            placeholder="Check type (e.g., grammar, brevity, custom_check)"
            value={customCheckCommand}
            onChange={(e) => setCustomCheckCommand(e.target.value)}
            className="h-7 text-xs"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={addCustomCheck}
              disabled={!customCheckName.trim()}
              className="h-6 text-xs"
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowAddCustom(false);
                setCustomCheckName('');
                setCustomCheckCommand('');
              }}
              className="h-6 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <></>
        // <Button
        //   size="sm"
        //   variant="outline"
        //   onClick={() => setShowAddCustom(true)}
        //   className="w-full h-7 text-xs"
        // >
        //   <Plus className="h-3 w-3 mr-1" />
        //   Add Custom Check
        // </Button>
      )}
    </div>
  );
};
