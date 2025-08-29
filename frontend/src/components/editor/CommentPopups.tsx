import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MessageCircle,
  Edit,
  Trash2,
  CheckCircle,
  Circle,
  Send,
  AlertCircle,
} from 'lucide-react';
import { commentSystem } from './CommentSystem';
import { formatDistanceToNow } from 'date-fns';

interface AddCommentPopupProps {
  selectedText: string;
  block: any;
  onClose: () => void;
  onCommentAdded: (thread: any) => void;
  docId: string;
}

interface CommentThreadPopupProps {
  threadId: string;
  onClose: () => void;
  activeUser: any;
  docId: string;
  removeCommentMarkersByThreadId: (threadId: string) => void;
}

// Popup for adding a new comment
export function AddCommentPopup({
  selectedText,
  block,
  onClose,
  onCommentAdded,
  docId,
}: AddCommentPopupProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ensure docId is set in comment system
  useEffect(() => {
    if (docId) {
      commentSystem.setDocumentId(docId);
    }
  }, [docId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      const textToStore = selectedText.trim();
      const thread = await commentSystem.createThread(block.id, comment, {
        start: 0,
        end: textToStore.length,
      });

      if (thread) {
        onCommentAdded(thread);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Render using portal to document.body
  return createPortal(
    <div className="comment-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="comment-popup-modal bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="comment-popup-header flex items-center justify-between p-4 border-b">
          <div className="comment-popup-header-title flex items-center gap-2">
            <div className="comment-popup-icon w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
              <MessageCircle size={18} />
            </div>
            <h5 className="font-semibold">New Comment</h5>
          </div>
          <button
            onClick={onClose}
            className="comment-popup-close-btn p-1 hover:bg-gray-100 rounded"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Selected text preview */}
        <div className="comment-popup-reference p-4 bg-gray-50 border-b">
          <div className="comment-popup-reference-label flex items-center gap-1 mb-2 text-sm text-gray-600">
            <AlertCircle size={14} />
            <span>Selected text</span>
          </div>
          <div className="comment-popup-reference-content bg-white p-3 border-l-4 border-yellow-400 rounded-r text-sm">
            {selectedText.trim().length > 120
              ? `"${selectedText.trim().substring(0, 120)}..."`
              : `"${selectedText.trim()}"`}
          </div>
        </div>

        {/* Comment input */}
        <div className="comment-popup-input-container p-4 flex-1">
          <div className="comment-popup-textarea-wrapper relative">
            <textarea
              ref={textareaRef}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your comment..."
              rows={4}
              className="comment-popup-comment-textarea w-full border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSubmit}
              disabled={!comment.trim() || isSubmitting}
              className="comment-popup-send-button absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Submit comment (Shift+Enter)"
            >
              {isSubmitting ? (
                <div className="comment-popup-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>

          <div className="comment-popup-comment-footer flex items-center justify-between mt-3">
            <small className="comment-popup-typing-hint text-xs text-gray-500">
              Press Shift+Enter for new line
            </small>
            <button
              onClick={onClose}
              className="comment-popup-cancel-link text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Popup for viewing and managing comments in a thread
export function CommentThreadPopup({
  threadId,
  onClose,
  activeUser,
  docId,
  removeCommentMarkersByThreadId,
}: CommentThreadPopupProps) {
  const [thread, setThread] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newReply, setNewReply] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  // Helper function to extract text content from the new API format
  const getCommentText = (comment: any) => {
    if (!comment) return '';

    if (comment.body && Array.isArray(comment.body)) {
      return comment.body.map((item: any) => item.text || '').join('');
    }

    return comment.content || '';
  };

  // Ensure docId is set in comment system
  useEffect(() => {
    if (docId) {
      commentSystem.setDocumentId(docId);
    }
  }, [docId]);

  const loadThread = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const threadData = await commentSystem.getThread(threadId);
      setThread(threadData);
    } catch (error) {
      console.error('Error loading thread:', error);
      removeCommentMarkersByThreadId(threadId);
      onClose();
      setThread(null);
    } finally {
      setIsLoading(false);
    }
  }, [threadId, removeCommentMarkersByThreadId, onClose]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  useEffect(() => {
    if (thread && commentsContainerRef.current) {
      commentsContainerRef.current.scrollTop =
        commentsContainerRef.current.scrollHeight;
    }
  }, [thread]);

  const handleAddReply = async () => {
    if (!newReply.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await commentSystem.addComment(threadId, newReply);
      if (result) {
        setNewReply('');
        await loadThread(); // Refresh the thread
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (comment: any) => {
    setEditingComment(comment.id);
    setEditContent(getCommentText(comment));
  };

  const handleSaveEdit = async () => {
    if (!editingComment || !editContent.trim()) return;

    setIsSubmitting(true);
    try {
      const success = await commentSystem.editComment(
        threadId,
        editingComment,
        editContent
      );
      if (success) {
        setEditingComment(null);
        setEditContent('');
        await loadThread();
      }
    } catch (error) {
      console.error('Error editing comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setIsSubmitting(true);
    try {
      const success = await commentSystem.deleteComment(threadId, commentId);
      if (success) {
        removeCommentMarkersByThreadId(threadId);
        onClose();
        return;
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleResolved = async () => {
    setIsSubmitting(true);
    try {
      await commentSystem.toggleThreadResolution(threadId);
      removeCommentMarkersByThreadId(threadId);
      onClose();
      return;
    } catch (error) {
      console.error('Error toggling resolution:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingComment) {
        handleSaveEdit();
      } else {
        handleAddReply();
      }
    }
  };

  if (isLoading) {
    return createPortal(
      <div className="comment-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="comment-popup-modal bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading comments...</p>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (!thread) {
    return createPortal(
      <div className="comment-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="comment-popup-modal bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8">
          <div className="text-center">
            <p className="text-red-600">Failed to load comments</p>
            <button
              onClick={onClose}
              className="mt-4 text-blue-600 hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="comment-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="comment-popup-modal bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div
          className={`comment-popup-header flex items-center justify-between p-4 border-b ${
            thread.resolved ? 'bg-green-50' : ''
          }`}
        >
          <div className="comment-popup-header-title flex items-center gap-2">
            <div
              className={`comment-popup-icon w-8 h-8 rounded-full flex items-center justify-center ${
                thread.resolved ? 'bg-green-600' : 'bg-blue-600'
              } text-white`}
            >
              {thread.resolved ? (
                <CheckCircle size={18} />
              ) : (
                <MessageCircle size={18} />
              )}
            </div>
            <h5 className="font-semibold">Comments</h5>
          </div>
          <div className="comment-popup-header-actions flex items-center gap-2">
            <button
              onClick={handleToggleResolved}
              disabled={isSubmitting}
              className={`comment-popup-action-button ${
                thread.resolved ? 'text-green-600' : 'text-blue-600'
              }`}
            >
              {thread.resolved ? (
                <CheckCircle size={16} />
              ) : (
                <Circle size={16} />
              )}
            </button>
            <button
              onClick={onClose}
              className="comment-popup-close-btn p-1 hover:bg-gray-100 rounded"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Comments list */}
        <div
          className="comment-popup-comments-container flex-1 overflow-y-auto p-4"
          ref={commentsContainerRef}
        >
          {thread.comments &&
            thread.comments.map((comment: any, index: number) => (
              <div
                key={comment.id || index}
                className="comment-popup-comment-item mb-4 bg-gray-50 rounded-lg"
              >
                <div className="comment-popup-comment-content p-3">
                  <div className="comment-popup-comment-header-row flex items-center justify-between mb-2">
                    <div className="comment-popup-comment-author flex items-center gap-2">
                      <div className="comment-popup-author-avatar w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                        {comment.author?.firstname?.[0] || 'U'}
                      </div>
                      <div className="comment-popup-author-info">
                        <div className="comment-popup-author-name text-sm font-medium">
                          {comment.author?.firstname} {comment.author?.lastname}
                        </div>
                        <div className="comment-popup-comment-time text-xs text-gray-500">
                          {comment.created_at
                            ? formatDistanceToNow(
                                new Date(comment.created_at),
                                { addSuffix: true }
                              )
                            : 'Just now'}
                        </div>
                      </div>
                    </div>
                    <div className="comment-popup-comment-actions flex items-center gap-1">
                      {comment.author?.id === activeUser.id && (
                        <>
                          <button
                            onClick={() => handleEditComment(comment)}
                            className="comment-popup-action-icon p-1 hover:bg-gray-200 rounded"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="comment-popup-action-icon p-1 hover:bg-gray-200 rounded text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingComment === comment.id ? (
                    <div className="comment-popup-edit-container">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="comment-popup-edit-textarea w-full border rounded p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                      <div className="comment-popup-edit-actions flex items-center gap-2 mt-2">
                        <button
                          onClick={() => setEditingComment(null)}
                          className="comment-popup-cancel-button text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={isSubmitting}
                          className="comment-popup-save-button text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="comment-popup-comment-text text-sm">
                      {getCommentText(comment)}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Reply input */}
        <div className="comment-popup-reply-container p-4 border-t">
          <div className="comment-popup-textarea-wrapper relative">
            <textarea
              ref={replyTextareaRef}
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a reply..."
              rows={3}
              className="comment-popup-reply-textarea w-full border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddReply}
              disabled={!newReply.trim() || isSubmitting}
              className="comment-popup-send-button absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="comment-popup-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
          <div className="comment-popup-reply-footer mt-2">
            <small className="comment-popup-reply-hint text-xs text-gray-500">
              Press Enter to send, Shift+Enter for new line
            </small>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
