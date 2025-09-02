import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import useEditor from '../hooks/useEditor';

interface FloatingIssueTooltipProps {
  editorRef: React.RefObject<HTMLDivElement>;
}

interface IssuePayload {
  issueId: string;
  checkId: string;
  originalText: string;
  suggestion: string;
  message: string;
  kind: string;
  rect?: DOMRect;
}

/**
 * Displays a floating tooltip for an inline IssueMarker with actions to Apply or Reject.
 * Also emits lifecycle events to allow sequential checklist coordination.
 */
export const FloatingIssueTooltip: React.FC<FloatingIssueTooltipProps> = ({
  editorRef,
}) => {
  const { editorRef: blocknoteRef } = useEditor();
  const [issue, setIssue] = useState<IssuePayload | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<IssuePayload>;
      const payload = ce.detail;
      setIssue(payload);

      if (editorRef.current) {
        const editorRect = editorRef.current.getBoundingClientRect();
        const markerRect = payload.rect;
        if (markerRect) {
          const scrollTop = (editorRef.current as any).scrollTop || 0;
          const scrollLeft = (editorRef.current as any).scrollLeft || 0;
          const top = markerRect.bottom - editorRect.top + scrollTop + 6;
          const left =
            markerRect.left -
            editorRect.left +
            scrollLeft +
            markerRect.width / 2;
          setPosition({ top, left });
        }
      }
    };

    window.addEventListener('showIssue', handler as EventListener);
    return () =>
      window.removeEventListener('showIssue', handler as EventListener);
  }, [editorRef]);

  if (!issue) return null;

  const applySuggestion = () => {
    try {
      const bn = blocknoteRef?.current as any;
      if (!bn) return;

      // Replace the inline issue node with suggestion text inside the affected block
      // Strategy: walk all blocks, locate inline node with matching issueId and replace it with plain text
      const allBlocks = bn.document || [];
      const updatedBlocks = allBlocks.map((block: any) => {
        if (!Array.isArray(block.content)) return block;
        let changed = false;
        const newContent = block.content.flatMap((node: any) => {
          if (node.type === 'issue' && node.props?.issueId === issue.issueId) {
            changed = true;
            return [
              {
                type: 'text',
                text: issue.suggestion || issue.originalText,
                styles: {},
              },
            ];
          }
          return [node];
        });
        return changed ? { ...block, content: newContent } : block;
      });

      bn.replaceBlocks(allBlocks, updatedBlocks as any);

      // Notify listeners that this issue is resolved
      window.dispatchEvent(
        new CustomEvent('issueResolved', {
          detail: {
            issueId: issue.issueId,
            checkId: issue.checkId,
            action: 'applied',
          },
        })
      );
    } catch (err) {
      console.error('Failed to apply suggestion', err);
    } finally {
      setIssue(null);
    }
  };

  const rejectSuggestion = () => {
    try {
      const bn = blocknoteRef?.current as any;
      if (!bn) return;

      const allBlocks = bn.document || [];
      const updatedBlocks = allBlocks.map((block: any) => {
        if (!Array.isArray(block.content)) return block;
        let changed = false;
        const newContent = block.content.flatMap((node: any) => {
          if (node.type === 'issue' && node.props?.issueId === issue.issueId) {
            changed = true;
            return [
              {
                type: 'text',
                text: issue.originalText,
                styles: {},
              },
            ];
          }
          return [node];
        });
        return changed ? { ...block, content: newContent } : block;
      });

      bn.replaceBlocks(allBlocks, updatedBlocks as any);

      window.dispatchEvent(
        new CustomEvent('issueResolved', {
          detail: {
            issueId: issue.issueId,
            checkId: issue.checkId,
            action: 'rejected',
          },
        })
      );
    } catch (err) {
      console.error('Failed to reject suggestion', err);
    } finally {
      setIssue(null);
    }
  };

  return (
    <div
      className="absolute z-50 pointer-events-auto"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="w-80 border rounded-md shadow-md bg-white dark:bg-card border-border p-3">
        {/* <div className="text-xs font-medium mb-1 text-foreground">
          {issue.message || 'Suggested change'}
        </div> */}
        <div className="text-xs text-muted-foreground mb-2">
          <b>Replace with</b> "{issue.suggestion || issue.originalText}"
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-7" onClick={applySuggestion}>
            Apply
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={rejectSuggestion}
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
};
