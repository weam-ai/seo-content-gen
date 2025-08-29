import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import { Thread, CommentSelection, LegacyComment, LegacyReply } from '../types';
import ThreadService from '@/lib/services/ThreadService';
import { useParams } from 'react-router-dom';

interface CommentContextType {
  threads: Thread[];
  comments: LegacyComment[]; // For backward compatibility
  activeSelection: CommentSelection | null;
  showCommentInput: boolean;
  editorRef: React.MutableRefObject<any> | null;
  loading: boolean;
  error: string | null;
  addComment: (text: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  resolveThread: (threadId: string) => Promise<void>;
  addReply: (threadId: string, text: string) => Promise<void>;
  setActiveSelection: (selection: CommentSelection | null) => void;
  setShowCommentInput: (show: boolean) => void;
  setEditorRef: (ref: React.MutableRefObject<any> | null) => void;
  getCommentsForBlock: (blockId: string) => LegacyComment[];
  refreshThreads: () => Promise<void>;
}

const CommentContext = createContext<CommentContextType | undefined>(undefined);

// Helper function to replace selected text with comment marker
const replaceSelectedTextWithCommentMarker = (
  block: any,
  selectedText: string,
  commentId: string
) => {
  if (!block.content || !Array.isArray(block.content)) {
    return null;
  }

  // Build the full text content of the block
  let fullText = '';
  const contentMap: Array<{
    start: number;
    end: number;
    node: any;
    index: number;
  }> = [];

  block.content.forEach((node: any, index: number) => {
    const nodeText = node.text || '';
    contentMap.push({
      start: fullText.length,
      end: fullText.length + nodeText.length,
      node: node,
      index: index,
    });
    fullText += nodeText;
  });

  // Find where the selected text appears in the full text
  const selectionStart = fullText.indexOf(selectedText);
  if (selectionStart === -1) {
    return null;
  }

  const selectionEnd = selectionStart + selectedText.length;

  // Create new content array with comment marker replacement
  const newContent: any[] = [];
  let replacementInserted = false;

  contentMap.forEach(({ start, end, node }) => {
    if (end <= selectionStart) {
      // Node is completely before selection - keep as is
      newContent.push(node);
    } else if (start >= selectionEnd) {
      // Node is completely after selection - keep as is
      newContent.push(node);
    } else {
      // Node overlaps with selection
      const nodeText = node.text || '';

      // Add text before selection (if any)
      if (start < selectionStart) {
        const beforeText = nodeText.substring(0, selectionStart - start);
        if (beforeText) {
          newContent.push({
            ...node,
            text: beforeText,
          });
        }
      }

      // Add comment marker (only once)
      if (!replacementInserted) {
        newContent.push({
          type: 'comment',
          props: {
            commentId: commentId,
            commentedText: selectedText,
          },
        });
        replacementInserted = true;
      }

      // Add text after selection (if any)
      if (end > selectionEnd) {
        const afterText = nodeText.substring(selectionEnd - start);
        if (afterText) {
          newContent.push({
            ...node,
            text: afterText,
          });
        }
      }
    }
  });

  return {
    ...block,
    content: newContent,
  };
};

interface CommentProviderProps {
  children: ReactNode;
}

export const CommentProvider: React.FC<CommentProviderProps> = ({
  children,
}) => {
  const { articleId } = useParams<{ articleId: string }>();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeSelection, setActiveSelection] =
    useState<CommentSelection | null>(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [editorRef, setEditorRef] =
    useState<React.MutableRefObject<any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to convert API thread to legacy comment format
  const convertThreadToLegacyComment = (thread: Thread): LegacyComment => {
    const firstComment = thread.comments[0];
    return {
      id: thread.id,
      text: firstComment?.body[0]?.text || '',
      selectedText: '', // Will be extracted from marker
      blockId: thread.metadata?.blockId || '', // Handle missing metadata
      position: {
        start: thread.metadata?.markerPosition?.from || 0,
        end: thread.metadata?.markerPosition?.to || 0,
      },
      author: {
        id: firstComment?.author.id || '',
        name: `${firstComment?.author.firstname || ''} ${
          firstComment?.author.lastname || ''
        }`.trim(),
        avatar: firstComment?.author.profile_image,
      },
      createdAt: new Date(thread.createdAt),
      resolved: thread.resolved,
      replies: thread.comments.slice(1).map(
        (comment): LegacyReply => ({
          id: comment.id,
          text: comment.body[0]?.text || '',
          author: {
            id: comment.author.id,
            name: `${comment.author.firstname} ${comment.author.lastname}`.trim(),
            avatar: comment.author.profile_image,
          },
          createdAt: new Date(
            comment.createdAt || comment.author.created_at || ''
          ),
        })
      ),
    };
  };

  // Convert all threads to legacy comments for backward compatibility
  // For threads without metadata, we'll use default values
  const comments: LegacyComment[] = threads.map(convertThreadToLegacyComment);

  // Load threads from API
  const refreshThreads = useCallback(async () => {
    if (!articleId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await ThreadService.getThreads(articleId);
      setThreads(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load comments');
      console.error('Error loading threads:', err);
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  // Load threads on mount and when articleId changes
  useEffect(() => {
    refreshThreads();
  }, [refreshThreads]);

  const addComment = useCallback(
    async (text: string) => {
      if (!activeSelection || !editorRef?.current || !articleId) return;

      try {
        setLoading(true);
        setError(null);

        // Create thread with first comment
        const threadData = {
          text: [{ text }],
          type: 'comment',
          metadata: {
            blockId: activeSelection.blockId,
            markerPosition: {
              from: activeSelection.position.start,
              to: activeSelection.position.end,
            },
          },
        };

        const response = await ThreadService.createThread(
          articleId,
          threadData
        );
        const newThread = response.data;

        // Replace selected text with comment marker
        try {
          const editor = editorRef.current;
          const selection = editor.getSelection();

          if (selection && selection.blocks && selection.blocks.length > 0) {
            const selectedText = editor.getSelectedText();

            if (selectedText && selection.blocks.length === 1) {
              // Single block selection - replace selected text with comment marker
              const block = selection.blocks[0];
              const updatedBlock = replaceSelectedTextWithCommentMarker(
                block,
                selectedText,
                newThread.id
              );

              if (updatedBlock) {
                const allBlocks = editor.document;
                const updatedBlocks = allBlocks.map((b: any) =>
                  b.id === block.id ? updatedBlock : b
                );
                editor.replaceBlocks(allBlocks, updatedBlocks as any);
              }
            }
          }
        } catch (error) {
          console.error('Error inserting comment marker:', error);
        }

        // Refresh threads to get the updated list
        await refreshThreads();

        setShowCommentInput(false);
        setActiveSelection(null);
      } catch (err: any) {
        setError(err.message || 'Failed to add comment');
        console.error('Error adding comment:', err);
      } finally {
        setLoading(false);
      }
    },
    [activeSelection, editorRef, articleId, refreshThreads]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      try {
        setLoading(true);
        setError(null);

        // Find the thread to delete
        const threadToDelete = threads.find(
          (thread) => thread.id === commentId
        );

        if (threadToDelete && editorRef?.current) {
          // Remove comment marker from editor
          try {
            const editor = editorRef.current;
            const allBlocks = editor.document;

            const updatedBlocks = allBlocks.map((block: any) => {
              if (!block.content || !Array.isArray(block.content)) {
                return block;
              }

              let blockChanged = false;
              const newContent = [];

              for (const item of block.content) {
                if (item.type === 'comment') {
                  // Check all possible ways the comment ID might be stored
                  const itemCommentId =
                    item.props?.commentId || item.props?.threadId;

                  if (itemCommentId === commentId) {
                    // Replace the comment marker with just the original text
                    const originalText =
                      item.props?.commentedText || item.props?.text || '';
                    if (originalText) {
                      newContent.push({
                        type: 'text',
                        text: originalText,
                        styles: {},
                      });
                    }
                    blockChanged = true;
                    continue;
                  }
                }
                newContent.push(item);
              }

              // Return updated block if content changed, otherwise return original
              return blockChanged ? { ...block, content: newContent } : block;
            });

            editor.replaceBlocks(allBlocks, updatedBlocks as any);
          } catch (error) {
            console.error('Error removing comment marker:', error);
          }

          // Delete thread via API
          await ThreadService.deleteThread(commentId);

          // Dispatch event to notify components that comment was deleted
          window.dispatchEvent(
            new CustomEvent('commentDeleted', {
              detail: { commentId },
            })
          );

          // Refresh threads
          await refreshThreads();
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete comment');
        console.error('Error deleting comment:', err);
      } finally {
        setLoading(false);
      }
    },
    [threads, editorRef, refreshThreads]
  );

  const resolveThread = useCallback(
    async (threadId: string) => {
      try {
        setLoading(true);
        setError(null);

        const thread = threads.find((t) => t.id === threadId);
        if (thread) {
          if (thread.resolved) {
            await ThreadService.unresolveThread(threadId);
          } else {
            await ThreadService.resolveThread(threadId);
          }

          // Refresh threads
          await refreshThreads();
        }
      } catch (err: any) {
        setError(err.message || 'Failed to resolve comment');
        console.error('Error resolving thread:', err);
      } finally {
        setLoading(false);
      }
    },
    [threads, refreshThreads]
  );

  const addReply = useCallback(
    async (threadId: string, text: string) => {
      try {
        setLoading(true);
        setError(null);

        const replyData = {
          body: [{ text }],
        };

        await ThreadService.addComment(threadId, replyData);

        // Refresh threads to get the updated list
        await refreshThreads();
      } catch (err: any) {
        setError(err.message || 'Failed to add reply');
        console.error('Error adding reply:', err);
      } finally {
        setLoading(false);
      }
    },
    [refreshThreads]
  );

  const getCommentsForBlock = useCallback(
    (blockId: string) => {
      return comments.filter((comment) => comment.blockId === blockId);
    },
    [comments]
  );

  return (
    <CommentContext.Provider
      value={{
        threads,
        comments,
        activeSelection,
        showCommentInput,
        editorRef,
        loading,
        error,
        addComment,
        deleteComment,
        resolveThread,
        addReply,
        setActiveSelection,
        setShowCommentInput,
        setEditorRef,
        getCommentsForBlock,
        refreshThreads,
      }}
    >
      {children}
    </CommentContext.Provider>
  );
};

export const useComments = () => {
  const context = useContext(CommentContext);
  if (!context) {
    throw new Error('useComments must be used within a CommentProvider');
  }
  return context;
};
