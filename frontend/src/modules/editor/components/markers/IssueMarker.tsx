import { createReactInlineContentSpec } from '@blocknote/react';
import { AlertCircle } from 'lucide-react';
import React, { useRef } from 'react';

/**
 * Inline issue marker used by automated checks. Renders the original text with a subtle highlight
 * and a small icon. Clicking the marker dispatches a global `showIssue` event with the issue data
 * so a floating tooltip can render actions (Apply/Reject).
 */
export const IssueMarker = createReactInlineContentSpec(
  {
    type: 'issue',
    propSchema: {
      issueId: { default: '' },
      checkId: { default: '' },
      kind: { default: 'generic' },
      originalText: { default: '' },
      suggestion: { default: '' },
      message: { default: '' },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const ref = useRef<HTMLSpanElement>(null);
      const { issueId, checkId, originalText, suggestion, message, kind } =
        props.inlineContent.props as any;

      const onClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = ref.current?.getBoundingClientRect();
        window.dispatchEvent(
          new CustomEvent('showIssue', {
            detail: {
              issueId,
              checkId,
              originalText,
              suggestion,
              message,
              kind,
              rect,
            },
          })
        );
      };

      return (
        <span
          ref={ref}
          className="inline-flex items-center"
          data-issue-id={issueId}
        >
          <span
            className="px-1 rounded cursor-pointer transition-colors duration-150 bg-red-50 dark:bg-red-900/40 text-foreground border border-red-200 dark:border-red-700"
            title={message || 'Issue'}
            onClick={onClick}
          >
            {originalText}
          </span>
          <span
            className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300 cursor-pointer"
            title={message || 'Issue'}
            onClick={onClick}
          >
            <AlertCircle className="w-2.5 h-2.5" />
          </span>
        </span>
      );
    },
  }
);
