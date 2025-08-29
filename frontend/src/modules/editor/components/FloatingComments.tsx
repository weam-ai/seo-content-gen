import React, { useState, useRef, useEffect } from 'react';
import { useComments } from '../context/CommentContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Check, Trash2, Reply, X } from 'lucide-react';
import { LegacyComment } from '../types';
import { formatDistanceToNow } from 'date-fns';
import useEditor from '../hooks/useEditor';

interface FloatingCommentsProps {
  editorRef: React.RefObject<HTMLDivElement>;
}

export const FloatingComments: React.FC<FloatingCommentsProps> = ({
  editorRef,
}) => {
  const { settings } = useEditor();
  const {
    comments,
    activeSelection,
    showCommentInput,
    loading,
    error,
    addComment,
    deleteComment,
    resolveThread,
    addReply,
    setShowCommentInput,
    setActiveSelection,
  } = useComments();

  const [commentText, setCommentText] = useState('');
  const [highlightedCommentId, setHighlightedCommentId] = useState<
    string | null
  >(null);
  const [focusedCommentId, setFocusedCommentId] = useState<string | null>(null);
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(
    null
  );
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [showReplyInput, setShowReplyInput] = useState<Record<string, boolean>>(
    {}
  );
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus comment input when it becomes visible
  useEffect(() => {
    if (showCommentInput && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [showCommentInput]);

  // Listen for comment marker clicks
  useEffect(() => {
    const handleShowComment = (event: CustomEvent) => {
      const { commentId } = event.detail;
      setHighlightedCommentId(commentId);
      setFocusedCommentId(commentId);

      // Auto-close other expanded comments when clicking on a marker
      if (expandedCommentId && expandedCommentId !== commentId) {
        setExpandedCommentId(null);
        setShowReplyInput({});
      }

      // Clear highlight after 3 seconds
      setTimeout(() => {
        setHighlightedCommentId(null);
      }, 3000);
    };

    // Listen for comment deletion events to clean up DOM
    const handleCommentDeleted = (event: CustomEvent) => {
      const { commentId } = event.detail;

      // Remove any lingering DOM markers that might not have been caught by the editor
      if (editorRef?.current) {
        const markers = editorRef.current.querySelectorAll(
          `[data-comment-id="${commentId}"], [data-thread-id="${commentId}"]`
        );

        markers.forEach((marker) => {
          // Get the original text content
          const originalText = marker.textContent || '';

          // Replace the marker element with just the text
          if (marker.parentNode && originalText) {
            const textNode = document.createTextNode(originalText);
            marker.parentNode.replaceChild(textNode, marker);
          } else {
            // If no text content, just remove the marker
            marker.remove();
          }
        });
      }
    };

    window.addEventListener('showComment', handleShowComment as EventListener);
    window.addEventListener(
      'commentDeleted',
      handleCommentDeleted as EventListener
    );

    return () => {
      window.removeEventListener(
        'showComment',
        handleShowComment as EventListener
      );
      window.removeEventListener(
        'commentDeleted',
        handleCommentDeleted as EventListener
      );
    };
  }, [expandedCommentId, editorRef]);

  const handleAddComment = async () => {
    if (commentText.trim()) {
      try {
        await addComment(commentText.trim());
        setCommentText('');
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    }
  };

  const handleCancelComment = () => {
    setShowCommentInput(false);
    setActiveSelection(null);
    setCommentText('');
  };

  const getCommentPosition = (
    comment: LegacyComment,
    index: number,
    allUnresolvedComments: LegacyComment[]
  ) => {
    if (!editorRef.current) {
      return { top: 0, right: 0 };
    }

    // First, try to find the comment marker directly by data-comment-id
    let markerElement = editorRef.current.querySelector(
      `[data-comment-id="${comment.id}"]`
    );

    // If not found, try searching for elements with the comment ID in various attributes
    if (!markerElement) {
      const allElements = Array.from(editorRef.current.querySelectorAll('*'));
      markerElement =
        allElements.find((element) => {
          return (
            element.getAttribute('data-comment-id') === comment.id ||
            element.getAttribute('data-thread-id') === comment.id ||
            // Check if this element contains the comment ID in its text or attributes
            (element.tagName === 'SPAN' &&
              element.textContent?.includes(comment.selectedText || ''))
          );
        }) || null;
    }

    if (!markerElement) {
      // Use fallback positioning when marker not found
      return { top: 50 + index * 80, right: -300 };
    }

    const markerRect = markerElement.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();

    // Get the scroll position of the editor container
    const editorScrollTop = editorRef.current.scrollTop || 0;

    // Calculate marker position relative to editor container, accounting for scroll
    // We need to get the position within the editor's coordinate system
    const markerTop = markerRect.top - editorRect.top + editorScrollTop;

    // Use consistent height for positioning calculations to prevent shifting
    // Always use the compact height for positioning, regardless of state
    const baseHeight = 60; // Base height for positioning calculations

    // Position the comment so its top aligns consistently with the marker
    // We'll anchor to the top of the marker rather than centering to avoid shifts
    let finalTop = markerTop;

    // Handle multiple comments on the same line by checking for overlaps
    const spacing = 5; // Spacing between stacked comments
    const blockComments = allUnresolvedComments.filter((c) => {
      if (c.id === comment.id) return false; // Exclude current comment

      // Get the position of other comments to check for overlaps
      const otherMarker = editorRef.current!.querySelector(
        `[data-comment-id="${c.id}"], [data-thread-id="${c.id}"]`
      );

      if (otherMarker) {
        const otherRect = otherMarker.getBoundingClientRect();
        const otherTop = otherRect.top - editorRect.top + editorScrollTop;

        // Check if they're on the same line or very close (within 25px)
        return Math.abs(markerTop - otherTop) < 25;
      }

      return false;
    });

    // Sort comments by their document order and stack them
    if (blockComments.length > 0) {
      const allCommentsInArea = [...blockComments, comment].sort((a, b) => {
        const aMarker = editorRef.current!.querySelector(
          `[data-comment-id="${a.id}"], [data-thread-id="${a.id}"]`
        );
        const bMarker = editorRef.current!.querySelector(
          `[data-comment-id="${b.id}"], [data-thread-id="${b.id}"]`
        );

        if (aMarker && bMarker) {
          const aRect = aMarker.getBoundingClientRect();
          const bRect = bMarker.getBoundingClientRect();

          // First sort by top position, then by left position for same line
          if (Math.abs(aRect.top - bRect.top) < 5) {
            return aRect.left - bRect.left;
          }
          return aRect.top - bRect.top;
        }

        return 0;
      });

      const currentIndex = allCommentsInArea.findIndex(
        (c) => c.id === comment.id
      );

      if (currentIndex > 0) {
        // Stack this comment below the previous ones using consistent base height
        let stackOffset = 0;
        for (let i = 0; i < currentIndex; i++) {
          stackOffset += baseHeight + spacing;
        }
        finalTop = markerTop + stackOffset;
      }
    }

    // Ensure the comment stays within the editor's visible bounds
    // Use a reasonable max height estimate for boundary calculations
    const estimatedMaxHeight = 200; // Conservative estimate for expanded comments
    const editorHeight = editorRect.height;
    const minTop = 10; // Small margin from top of editor
    const maxTop = editorHeight - estimatedMaxHeight - 10; // Small margin from bottom of editor

    finalTop = Math.max(minTop, Math.min(finalTop, maxTop));

    return {
      top: finalTop,
      right: -300, // Position to the right of the editor
    };
  };

  const getInputPosition = () => {
    if (!activeSelection || !editorRef.current) return { top: 0, right: 0 };

    const editorRect = editorRef.current.getBoundingClientRect();

    // Simple position calculation relative to editor container
    const relativeTop = activeSelection.rect.top - editorRect.top;

    return {
      top: relativeTop,
      right: -320,
    };
  };

  // Function to check if a comment marker exists in the editor
  const hasCommentMarkerInEditor = (commentId: string): boolean => {
    if (!editorRef.current) return false;

    // Method 1: Look for comment markers with this commentId in the DOM
    const commentMarker = editorRef.current.querySelector(
      `[data-comment-id="${commentId}"]`
    );

    // Method 1b: Also check for data-thread-id
    const threadMarker = editorRef.current.querySelector(
      `[data-thread-id="${commentId}"]`
    );

    // Method 2: Check for commentMarker elements with the commentId
    const commentMarkerElements = editorRef.current.querySelectorAll(
      '[data-type="comment"]'
    );
    const hasMarkerElement = Array.from(commentMarkerElements).some(
      (element) => {
        const props = (element as any).props || {};
        return props.commentId === commentId;
      }
    );

    // Method 3: Check the editor's document structure if available
    let hasMarkerInDocument = false;
    try {
      // Try to access the editor instance and check its document
      const editorInstance = (editorRef.current as any).editor;
      if (editorInstance && editorInstance.document) {
        const blocks = editorInstance.document;
        hasMarkerInDocument = blocks.some((block: any) => {
          if (block.content && Array.isArray(block.content)) {
            return block.content.some((item: any) => {
              return (
                item.type === 'comment' &&
                item.props &&
                (item.props.commentId === commentId ||
                  item.props.threadId === commentId)
              );
            });
          }
          return false;
        });
      }
    } catch (error) {
      console.log('Could not access editor document:', error);
    }

    // Method 4: Search in text content for comment marker references
    const hasMarkerInContent =
      editorRef.current.textContent?.includes(commentId) || false;

    const result = !!(
      commentMarker ||
      threadMarker ||
      hasMarkerElement ||
      hasMarkerInDocument ||
      hasMarkerInContent
    );

    return result;
  };

  // Filter comments to only show those that have markers in the editor
  // For debugging, we'll temporarily show all comments if none have markers
  const commentsWithMarkers = comments.filter((comment) =>
    hasCommentMarkerInEditor(comment.id)
  );

  // If no comments have markers but we have comments, show them anyway for debugging
  const commentsToShow =
    commentsWithMarkers.length > 0 ? commentsWithMarkers : comments;

  // Sort comments by their position in the document
  const sortedComments = commentsToShow.sort((a, b) => {
    // Get marker elements for both comments to determine their document order
    const aMarker = editorRef.current?.querySelector(
      `[data-comment-id="${a.id}"], [data-thread-id="${a.id}"]`
    );
    const bMarker = editorRef.current?.querySelector(
      `[data-comment-id="${b.id}"], [data-thread-id="${b.id}"]`
    );

    if (aMarker && bMarker && editorRef.current) {
      const editorRect = editorRef.current.getBoundingClientRect();
      const aRect = aMarker.getBoundingClientRect();
      const bRect = bMarker.getBoundingClientRect();

      const aTop = aRect.top - editorRect.top;
      const bTop = bRect.top - editorRect.top;

      // Sort by vertical position first, then horizontal position for same line
      if (Math.abs(aTop - bTop) < 5) {
        return aRect.left - bRect.left;
      }
      return aTop - bTop;
    }

    return 0;
  });

  // Show all comments (both resolved and unresolved) in floating area
  const allCommentsToShow = sortedComments; // Show all comments together

  // Show loading state
  if (loading && comments.length === 0) {
    return (
      <div className="absolute top-4 right-4 z-30 pointer-events-auto">
        <div className="bg-white p-3 rounded-lg shadow-md border">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-muted-foreground">
              Loading comments...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="absolute top-4 right-4 z-30 pointer-events-auto">
        <div className="bg-red-50 p-3 rounded-lg shadow-md border border-red-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-600">Error: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Comment Input Popup */}
      {showCommentInput && activeSelection && (
        <div
          className="absolute z-50 pointer-events-auto"
          style={getInputPosition()}
        >
          <Card
            className={`w-80 shadow-lg border ${
              settings.theme === 'dark'
                ? 'bg-card border-border'
                : 'bg-white border-border'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-foreground">
                    Add Comment
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelComment}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3 text-foreground" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                "{activeSelection.selectedText}"
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Textarea
                ref={commentInputRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add your comment..."
                className="min-h-[80px] mb-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleAddComment();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  size="sm"
                  className="flex-1"
                >
                  Add Comment
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelComment}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Comments */}
      {allCommentsToShow.length > 0
        ? allCommentsToShow.map((comment, index) => (
            <div
              key={comment.id}
              className={`absolute pointer-events-auto transition-all duration-200 ${
                focusedCommentId === comment.id ||
                expandedCommentId === comment.id
                  ? 'z-50'
                  : 'z-40'
              }`}
              style={getCommentPosition(comment, index, allCommentsToShow)}
              onMouseEnter={() => {
                setFocusedCommentId(comment.id);

                // Auto-close expanded replies when focusing on a different comment
                if (expandedCommentId && expandedCommentId !== comment.id) {
                  setExpandedCommentId(null);
                  setShowReplyInput({});
                }

                // Dispatch event to highlight inline comment marker
                window.dispatchEvent(
                  new CustomEvent('highlightCommentMarker', {
                    detail: { commentId: comment.id, highlight: true },
                  })
                );
              }}
              onMouseLeave={() => {
                setFocusedCommentId(null);
                // Dispatch event to remove highlight from inline comment marker
                window.dispatchEvent(
                  new CustomEvent('highlightCommentMarker', {
                    detail: { commentId: comment.id, highlight: false },
                  })
                );
              }}
            >
              <CompactCommentCard
                comment={comment}
                isHighlighted={
                  highlightedCommentId === comment.id ||
                  focusedCommentId === comment.id
                }
                isExpanded={expandedCommentId === comment.id}
                isFocused={focusedCommentId === comment.id}
                onExpand={() => {
                  // Auto-close other expanded comments and reply inputs
                  if (expandedCommentId !== comment.id) {
                    // Close any open reply inputs
                    setShowReplyInput({});
                  }
                  setExpandedCommentId(
                    expandedCommentId === comment.id ? null : comment.id
                  );
                }}
                onResolve={async () => {
                  try {
                    await resolveThread(comment.id);
                  } catch (error) {
                    console.error('Error resolving thread:', error);
                  }
                }}
                onDelete={async () => {
                  try {
                    await deleteComment(comment.id);

                    // Dispatch event to clean up any lingering DOM markers
                    window.dispatchEvent(
                      new CustomEvent('commentDeleted', {
                        detail: { commentId: comment.id },
                      })
                    );
                  } catch (error) {
                    console.error('Error deleting comment:', error);
                  }
                }}
                onReply={(text) => addReply(comment.id, text)}
                replyText={replyTexts[comment.id] || ''}
                setReplyText={(text) =>
                  setReplyTexts((prev) => ({ ...prev, [comment.id]: text }))
                }
                showReplyInput={showReplyInput[comment.id] || false}
                setShowReplyInput={(show) =>
                  setShowReplyInput((prev) => ({ ...prev, [comment.id]: show }))
                }
                settings={settings}
              />
            </div>
          ))
        : /* Debug fallback when no comments */
          process.env.NODE_ENV === 'development' &&
          comments.length > 0 && (
            <div className="absolute top-20 right-4 z-50 pointer-events-auto bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 p-2 rounded text-xs text-yellow-900 dark:text-yellow-100">
              No unresolved comments to display, but {comments.length} total
              comments found
            </div>
          )}

      {/* Resolved Comments (if any) */}
      {/* Resolved comments are now shown inline with unresolved comments above */}
    </div>
  );
};

interface CompactCommentCardProps {
  comment: LegacyComment;
  isHighlighted?: boolean;
  isExpanded?: boolean;
  isFocused?: boolean;
  onExpand: () => void;
  onResolve: () => void;
  onDelete: () => void;
  onReply: (text: string) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  showReplyInput: boolean;
  setShowReplyInput: (show: boolean) => void;
  settings: any;
}

const CompactCommentCard: React.FC<CompactCommentCardProps> = ({
  comment,
  isHighlighted = false,
  isExpanded = false,
  isFocused = false,
  onExpand,
  onResolve,
  onDelete,
  onReply,
  replyText,
  setReplyText,
  showReplyInput,
  setShowReplyInput,
  settings,
}) => {
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <Card
      className={`transition-all duration-200 ${
        isHighlighted ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      } ${
        // Different styles for focused vs unfocused
        isFocused || showReplyInput || isExpanded
          ? `w-64 shadow-lg border ${
              settings.theme === 'dark' ? 'bg-card' : 'bg-white'
            }`
          : `w-64 shadow-md border ${
              settings.theme === 'dark'
                ? 'bg-card/80 backdrop-blur-sm'
                : 'bg-white/80 backdrop-blur-sm'
            }`
      } ${
        // Add resolved styling
        comment.resolved
          ? settings.theme === 'dark'
            ? 'opacity-75 bg-green-950/60'
            : 'opacity-75 bg-green-50/80'
          : ''
      }`}
    >
      <CardContent
        className={isFocused || showReplyInput || isExpanded ? 'p-3' : 'p-2'}
      >
        {/* Resolved Badge */}
        {comment.resolved && (
          <div className="flex items-center gap-1 mb-2">
            <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              Resolved
            </span>
          </div>
        )}
        {/* Minimal View (when not focused) */}
        {!isFocused && !showReplyInput && !isExpanded && (
          <div className="flex items-start gap-2">
            <Avatar className="w-4 h-4">
              <AvatarImage src={comment.author.avatar} />
              <AvatarFallback className="text-xs">
                {comment.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs font-medium truncate text-foreground">
                  {comment.author.name}
                </span>
                {comment.resolved && (
                  <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                )}
                {hasReplies && (
                  <span className="text-xs text-muted-foreground">
                    ({comment.replies?.length} replies)
                  </span>
                )}
              </div>
              <div
                className="text-xs text-muted-foreground"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {comment.text}
              </div>
            </div>
          </div>
        )}

        {/* Full View (when focused/expanded) */}
        {(isFocused || showReplyInput || isExpanded) && (
          <>
            {/* Compact Header */}
            <div className="flex items-start gap-2 mb-2">
              <Avatar className="w-5 h-5">
                <AvatarImage src={comment.author.avatar} />
                <AvatarFallback className="text-xs">
                  {comment.author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start flex-col">
                  <span className="text-xs font-medium truncate text-foreground">
                    {comment.author.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(comment.createdAt, {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Comment Text */}
            <div
              className="text-sm mb-2 text-foreground"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {comment.text}
            </div>

            {/* Compact Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {!comment.resolved && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!isExpanded) {
                        onExpand();
                      }
                      setShowReplyInput(!showReplyInput);
                    }}
                    className="h-6 w-6 p-0"
                    title="Reply"
                  >
                    <Reply className="w-3 h-3 text-foreground" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onResolve}
                  className={`h-6 w-6 p-0 ${
                    comment.resolved
                      ? 'text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300'
                      : 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                  }`}
                  title={comment.resolved ? 'Unresolve' : 'Resolve'}
                >
                  <Check className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {hasReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExpand}
                  className="h-6 px-2 text-xs text-foreground"
                >
                  {isExpanded ? 'Hide' : `${comment.replies?.length} replies`}
                </Button>
              )}
            </div>
          </>
        )}

        {/* Reply Input (only available for unresolved comments when showReplyInput is true) */}
        {showReplyInput && !isExpanded && !comment.resolved && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-2">
              <Reply className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Reply</span>
            </div>
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Add a reply..."
              className="min-h-[50px] mb-2 text-xs resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  if (replyText.trim()) {
                    onReply(replyText.trim());
                    setReplyText('');
                    setShowReplyInput(false);
                  }
                }
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                ⌘+Enter to send
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowReplyInput(false);
                    setReplyText('');
                  }}
                  size="sm"
                  className="h-6 px-2 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (replyText.trim()) {
                      try {
                        await onReply(replyText.trim());
                        setReplyText('');
                        setShowReplyInput(false);
                      } catch (error) {
                        console.error('Error adding reply:', error);
                      }
                    }
                  }}
                  disabled={!replyText.trim()}
                  size="sm"
                  className="h-6 px-2 text-xs"
                >
                  Reply
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t">
            {/* Replies */}
            {hasReplies && comment.replies && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px bg-border flex-1"></div>
                  <span className="text-xs font-medium text-muted-foreground px-2">
                    {comment.replies.length}{' '}
                    {comment.replies.length === 1 ? 'Reply' : 'Replies'}
                  </span>
                  <div className="h-px bg-border flex-1"></div>
                </div>
                <div className="space-y-3">
                  {comment.replies.map((reply, index) => (
                    <div key={reply.id} className="relative">
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <Avatar className="w-5 h-5 mt-0.5">
                          <AvatarImage src={comment.author.avatar} />
                          <AvatarFallback className="text-xs">
                            {reply.author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-foreground">
                              {reply.author.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(reply.createdAt, {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <div className="text-sm text-foreground leading-relaxed">
                            {reply.text}
                          </div>
                        </div>
                      </div>
                      {/* Connection line for threading */}
                      {index < (comment?.replies?.length ?? 0) - 1 && (
                        <div className="absolute left-2.5 top-8 w-px h-3 bg-border"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply Input (only for unresolved comments) */}
            {showReplyInput && !comment.resolved && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Reply className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">
                    Add reply
                  </span>
                </div>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  className="min-h-[60px] mb-2 text-sm resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      if (replyText.trim()) {
                        onReply(replyText.trim());
                        setReplyText('');
                        setShowReplyInput(false);
                      }
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    ⌘+Enter to post
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowReplyInput(false);
                        setReplyText('');
                      }}
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        if (replyText.trim()) {
                          try {
                            await onReply(replyText.trim());
                            setReplyText('');
                            setShowReplyInput(false);
                          } catch (error) {
                            console.error('Error adding reply:', error);
                          }
                        }
                      }}
                      disabled={!replyText.trim()}
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
