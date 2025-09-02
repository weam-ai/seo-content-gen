import { createReactInlineContentSpec } from '@blocknote/react';
import { MessageCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';

export const CommentMarker = createReactInlineContentSpec(
  {
    type: 'comment',
    propSchema: {
      //new
      commentId: {
        default: '',
      },
      commentedText: {
        default: '',
      },
      //from old
      text: {
        default: 'Unknown',
      },
      threadId: {
        default: 'Unknown',
      },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const CommentMarkerComponent = () => {
        const markerRef = useRef<HTMLSpanElement>(null);
        const commentId =
          props.inlineContent.props.commentId ||
          props.inlineContent.props.threadId;
        const commentedText =
          props.inlineContent.props.commentedText ||
          props.inlineContent.props.text;

        // Check if we're in the article editor context (should use original dark mode styles)
        // vs article details page (should use light theme only)
        const isInEditor =
          window.location.pathname.includes('/article-editor/');

        useEffect(() => {
          const handleHighlight = (event: CustomEvent) => {
            const { commentId: eventCommentId, highlight } = event.detail;

            if (eventCommentId === commentId && markerRef.current) {
              const textSpan =
                markerRef.current.querySelector('.commented-text');
              const iconSpan = markerRef.current.querySelector('.comment-icon');

              if (highlight) {
                if (isInEditor) {
                  // Original styling with dark mode support for editor
                  textSpan?.classList.add(
                    'bg-yellow-300',
                    'dark:bg-yellow-600',
                    'ring-2',
                    'ring-yellow-400',
                    'dark:ring-yellow-500'
                  );
                  textSpan?.classList.remove(
                    'bg-yellow-100',
                    'dark:bg-yellow-800'
                  );
                  iconSpan?.classList.add(
                    'bg-blue-200',
                    'dark:bg-blue-700',
                    'ring-2',
                    'ring-blue-400',
                    'dark:ring-blue-500'
                  );
                  iconSpan?.classList.remove('bg-blue-100', 'dark:bg-blue-800');
                } else {
                  // Light theme only for article details page
                  textSpan?.classList.add(
                    'bg-yellow-300',
                    'ring-2',
                    'ring-yellow-400'
                  );
                  textSpan?.classList.remove('bg-yellow-100');
                  iconSpan?.classList.add(
                    'bg-blue-200',
                    'ring-2',
                    'ring-blue-400'
                  );
                  iconSpan?.classList.remove('bg-blue-100');
                }
              } else {
                if (isInEditor) {
                  // Original styling with dark mode support for editor
                  textSpan?.classList.remove(
                    'bg-yellow-300',
                    'dark:bg-yellow-600',
                    'ring-2',
                    'ring-yellow-400',
                    'dark:ring-yellow-500'
                  );
                  textSpan?.classList.add(
                    'bg-yellow-100',
                    'dark:bg-yellow-800'
                  );
                  iconSpan?.classList.remove(
                    'bg-blue-200',
                    'dark:bg-blue-700',
                    'ring-2',
                    'ring-blue-400',
                    'dark:ring-blue-500'
                  );
                  iconSpan?.classList.add('bg-blue-100', 'dark:bg-blue-800');
                } else {
                  // Light theme only for article details page
                  textSpan?.classList.remove(
                    'bg-yellow-300',
                    'ring-2',
                    'ring-yellow-400'
                  );
                  textSpan?.classList.add('bg-yellow-100');
                  iconSpan?.classList.remove(
                    'bg-blue-200',
                    'ring-2',
                    'ring-blue-400'
                  );
                  iconSpan?.classList.add('bg-blue-100');
                }
              }
            }
          };

          window.addEventListener(
            'highlightCommentMarker',
            handleHighlight as EventListener
          );
          return () => {
            window.removeEventListener(
              'highlightCommentMarker',
              handleHighlight as EventListener
            );
          };
        }, [commentId, isInEditor]);

        const handleClick = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();

          // Dispatch a custom event to show the comment
          window.dispatchEvent(
            new CustomEvent('showComment', {
              detail: { commentId },
            })
          );
        };

        // Get appropriate CSS classes based on context
        const getTextClasses = () => {
          if (isInEditor) {
            // Original styling with dark mode support for editor
            return 'commented-text bg-yellow-100 dark:bg-yellow-800 px-1 rounded cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-all duration-200';
          } else {
            // Light theme only for article details page
            return 'commented-text bg-yellow-100 px-1 rounded cursor-pointer hover:bg-yellow-200 transition-all duration-200';
          }
        };

        const getIconClasses = () => {
          if (isInEditor) {
            // Original styling with dark mode support for editor
            return 'comment-icon inline-flex items-center justify-center w-4 h-4 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-full cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-700 transition-all duration-200 ml-1';
          } else {
            // Light theme only for article details page
            return 'comment-icon inline-flex items-center justify-center w-4 h-4 bg-blue-100 text-blue-600 rounded-full cursor-pointer hover:bg-blue-200 transition-all duration-200 ml-1';
          }
        };

        return (
          <span
            ref={markerRef}
            className="inline-flex items-center"
            data-comment-id={commentId}
          >
            <span
              className={getTextClasses()}
              title="Commented text - click icon to view comment"
              onClick={handleClick}
              data-comment-id={commentId}
            >
              {commentedText}
            </span>
            <span
              className={getIconClasses()}
              title="View Comment"
              data-comment-id={commentId}
              onClick={handleClick}
            >
              <MessageCircle className="w-2.5 h-2.5" />
            </span>
          </span>
        );
      };

      return <CommentMarkerComponent />;
    },
  }
);
