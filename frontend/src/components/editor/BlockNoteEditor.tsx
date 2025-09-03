import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import {
  FormattingToolbarController,
  useCreateBlockNote,
} from '@blocknote/react';
import { debounce } from 'lodash';
import { useYDoc, useYjsProvider } from '@y-sweet/react';
import { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { CustomFormattingToolbar } from './CustomFormattingToolbar';
import { BlockNoteSchema, defaultInlineContentSpecs } from '@blocknote/core';
import { Slice, Fragment, Node as ProseMirrorNode } from '@tiptap/pm/model';
import { EditorView } from '@tiptap/pm/view';
import { CommentMarker } from '@/modules/editor/components/markers/CommentMarker';
import APIService from '@/lib/services/APIService';
import { useSessionStore } from '@/lib/store/session-store';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from '@/components/ui/use-toast';
import { AddCommentPopup, CommentThreadPopup } from './CommentPopups';
import { commentSystem } from './CommentSystem';
// AI assistant functionality removed
// blocksToMarkdown import removed - unused in single-user app

// Define light theme for editor
const lightTheme = {
  colors: {
    editor: {
      text: '#333333',
      background: '#ffffff',
    },
    menu: {
      background: '#f9fafb',
      text: '#111827',
      border: '#e5e7eb',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
    tooltip: {
      background: '#111827',
      text: '#f9fafb',
    },
  },
  borderRadius: 6,
};

interface BlockNoteEditorProps {
  docId: string;
  initialContent?: any;
  onContentChange?: (content: any) => void;
  onSave?: (content: any) => void;
}

// Helper function to identify headings
function isHeading(block: any) {
  return block.type === 'heading' && block.props && block.props.level;
}

// Helper function to extract text from nested content structures (including links)
function extractTextFromContent(content: any[]): string {
  if (!Array.isArray(content)) return '';

  const extractedText = content
    .map((item: any) => {
      if (item.type === 'text') {
        return item.text || '';
      } else if (item.type === 'link' && Array.isArray(item.content)) {
        // Recursively extract text from link content
        return extractTextFromContent(item.content);
      } else if (Array.isArray(item.content)) {
        // Handle other nested content types
        return extractTextFromContent(item.content);
      }
      return '';
    })
    .join('');

  if (extractedText) {
    console.log(`[extractTextFromContent] Extracted text: "${extractedText}"`);
  }

  return extractedText;
}

function normalizeBlockTypes(blocks: any[]) {
  if (!Array.isArray(blocks)) return blocks;
  return blocks.map((block) => {
    if (isHeading(block)) return block;
    return {
      ...block,
      type: 'paragraph',
      props: block.props ? { ...block.props, level: undefined } : {},
    };
  });
}

function preprocessMarkdownContent(content: any[]) {
  if (!content || typeof content !== 'object') return content;

  console.log('[preprocessMarkdownContent] Starting with content:', content);

  // Create a deep copy to avoid mutating the original content
  const processedContent = JSON.parse(JSON.stringify(content));

  // Fix common issues with AI-generated content
  for (let i = 0; i < processedContent.length; i++) {
    const block = processedContent[i];

    // Check for paragraphs incorrectly marked as headings
    if (block.type === 'heading') {
      // Check if this is likely a paragraph based on content
      const text = extractTextFromContent(block.content || []);

      // Enhanced heuristics to detect paragraphs incorrectly marked as headings:
      const isProbablyParagraph = (() => {
        // STRICT RULE: Headings should almost never end with sentence-ending punctuation
        // This is the most reliable indicator of paragraph content
        if (
          (text.endsWith('.') || text.endsWith('!') || text.endsWith('?')) &&
          text.length > 10
        ) {
          console.log(
            `[STRICT RULE] Converting heading to paragraph (ends with punctuation): "${text}"`
          );
          return true;
        }

        // 1. Very long text is likely a paragraph
        if (text.length > 250) return true;

        // 3. Contains multiple sentences
        if (text.split('. ').length > 2) return true;

        // 4. Contains paragraph-like phrases/words that indicate explanatory content
        const paragraphIndicators = [
          'we believe',
          'we provide',
          'we offer',
          'we ensure',
          'we help',
          'this means',
          'this allows',
          'this ensures',
          'this helps',
          'by ensuring',
          'by providing',
          'by offering',
          'by helping',
          'supporting',
          'enabling',
          'allowing',
          'ensuring',
          'agencies also',
          'companies also',
          'businesses also',
          'it is important',
          'it is essential',
          'it is crucial',
          'for more on',
          'for more information',
          'see comparison',
          'see resources',
          'such as',
          'including',
          'for example',
          'in addition',
          'furthermore',
          'moreover',
          'however',
          'therefore',
          'as a result',
          'in conclusion',
          'to learn more',
          'check out',
          'visit',
          'explore',
          'discover',
          'according to',
          'based on',
          'research shows',
          'studies indicate',
        ];
        const lowerText = text.toLowerCase();
        const hasIndicators = paragraphIndicators.some((indicator) =>
          lowerText.includes(indicator)
        );

        // 5. Ends with period and has paragraph indicators (lowered threshold for referential content)
        if (text.endsWith('.') && hasIndicators && text.length > 60)
          return true;

        // 6. Contains em-dash or long explanatory phrases
        if ((text.includes('—') || text.includes(' - ')) && text.length > 80)
          return true;

        return false;
      })();

      if (isProbablyParagraph) {
        console.log(
          `Fixed block ${i} that was incorrectly marked as heading:`,
          text.substring(0, 40) + '...'
        );
        processedContent[i] = {
          ...block,
          type: 'paragraph',
          props: {},
        };
      }
    }

    // Ensure heading levels are valid (1-6)
    if (block.type === 'heading' && block.props) {
      if (
        !block.props.level ||
        block.props.level < 1 ||
        block.props.level > 6
      ) {
        console.log(`Fixed invalid heading level in block ${i}`);
        processedContent[i] = {
          ...block,
          props: { ...block.props, level: 2 }, // Default to h2 if invalid
        };
      }
    }
  }

  return processedContent;
}

// generateBlockId function removed - unused in single-user app

export const BlockNoteEditor = forwardRef<any, BlockNoteEditorProps>(
  ({ docId, initialContent, onContentChange, onSave }, ref) => {
    const [showAddCommentPopup, setShowAddCommentPopup] = useState(false);
    const [showCommentThreadPopup, setShowCommentThreadPopup] = useState(false);
    const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
    const [_selectedText] = useState('');
    const [commentData] = useState({
      selectedText: '',
      block: null,
    });
    // AI assistant functionality removed
    const [_selectedBlocks] = useState<any[] | null>(null);

    const editorContainerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);
    const sessionId = useSessionStore((state) => state.sessionId);
    const user = useAuthStore.getState().getUser();
    const token = useAuthStore.getState().getJwtToken();
    const isInitialLoad = useRef(true);

    const provider = useYjsProvider();
    const doc = useYDoc();

    const schema = BlockNoteSchema.create({
      inlineContentSpecs: {
        ...defaultInlineContentSpecs,
        comment: CommentMarker,
      },
    });

    const activeUser = useMemo(() => {
      if (!user) return { id: 'anonymous', email: '' } as any;
      return { id: user.id, email: user.email } as any;
    }, [user]);

    const editor = useCreateBlockNote({
      schema,
      collaboration: {
        provider,
        fragment: doc.getXmlFragment('blocknote'),
        user: {
          name: user?.email || 'User',
          color: '#888',
        },
      },
      _tiptapOptions: {
        parseOptions: {
          preserveWhitespace: 'full',
        },
        editorProps: {
          handleClick: (_view, _pos, event) => {
            // Handle link clicks in the editor
            const target = event.target as HTMLElement;
            const linkElement =
              target.closest('a') ||
              target.closest('[data-content-type="link"]');

            if (linkElement) {
              const href =
                linkElement.getAttribute('href') ||
                linkElement.getAttribute('data-href') ||
                linkElement.textContent;

              if (
                href &&
                (href.startsWith('http://') || href.startsWith('https://'))
              ) {
                event.preventDefault();
                event.stopPropagation();
                window.open(href, '_blank', 'noopener,noreferrer');
                return true;
              }
            }
            return false;
          },
          handleKeyDown: (view, event) => {
            // Handle keyboard shortcuts for headings and paragraph
            view;

            // Check for modifier keys (Cmd on Mac, Ctrl on Windows/Linux)
            const isMod = event.metaKey || event.ctrlKey;

            if (isMod && !event.shiftKey && !event.altKey) {
              const key = event.key;

              // Paragraph shortcut (Cmd/Ctrl + P)
              if (key === 'p') {
                event.preventDefault();
                if (editor) {
                  const block = editor.getTextCursorPosition().block;
                  editor.updateBlock(block, { type: 'paragraph' });
                }
                return true;
              }

              // Heading shortcuts (Cmd/Ctrl + 1-6)
              if (key >= '1' && key <= '6') {
                event.preventDefault();
                if (editor) {
                  const block = editor.getTextCursorPosition().block;
                  const level = parseInt(key) as 1 | 2 | 3 | 4 | 5 | 6;
                  editor.updateBlock(block, {
                    type: 'heading',
                    props: { level },
                  });
                }
                return true;
              }
            }

            return false;
          },
          transformPasted: (slice: Slice, view: EditorView) => {
            const urlRegex = /(https?:\/\/[^\s\]]+)/g; // Define regex here or import
            const newContentNodes: ProseMirrorNode[] = [];
            const schema = view.state.schema;

            slice.content.forEach((node: ProseMirrorNode) => {
              if (node.isText) {
                const text = node.text || '';
                let lastIndex = 0;
                const textNodes: ProseMirrorNode[] = [];

                text.replace(urlRegex, (match: any, url: any, offset: any) => {
                  // Add text before the URL
                  if (offset > lastIndex) {
                    textNodes.push(
                      schema.text(text.substring(lastIndex, offset), node.marks)
                    );
                  }

                  // Create a link mark
                  const linkMark = schema.marks.link.create({
                    href: url,
                    originalHref: url,
                    originalUrl: url,
                  });

                  // Create a text node with the link mark applied, preserving original text styles
                  const newMarks = [
                    ...node.marks.filter((mark: any) => mark.type.name !== 'link'),
                    linkMark,
                  ];
                  textNodes.push(schema.text(url, newMarks));

                  lastIndex = offset + match.length;
                  return match;
                });

                // Add any remaining text after the last URL
                if (lastIndex < text.length) {
                  textNodes.push(
                    schema.text(text.substring(lastIndex), node.marks)
                  );
                }

                // If textNodes were created (meaning URLs were found), add them
                if (textNodes.length > 0) {
                  newContentNodes.push(...textNodes);
                } else {
                  newContentNodes.push(node); // No URLs found, keep original text node
                }
              } else if (
                node.type.name === 'link' &&
                node.attrs &&
                node.attrs.href
              ) {
                // Existing logic for link nodes
                const newAttrs = {
                  ...node.attrs,
                  originalHref: node.attrs.href,
                  originalUrl: node.attrs.href,
                };
                const newNode = node.type.create(
                  newAttrs,
                  node.content,
                  node.marks
                );
                newContentNodes.push(newNode);
              } else if (node.content.size > 0) {
                // For nodes with content (e.g., paragraphs containing text nodes),
                // we need to recursively process their children.
                // This is a simplified recursion. For a full deep traversal, a separate recursive function
                // that maps over node.content and rebuilds the fragment would be more robust.
                // For now, we'll assume direct text nodes or simple link nodes are the primary concern.
                newContentNodes.push(node); // Keep non-text/non-link nodes as is
              } else {
                newContentNodes.push(node);
              }
            });

            const newFragment = Fragment.fromArray(newContentNodes);
            return new Slice(newFragment, slice.openStart, slice.openEnd);
          },
        },
      },
      domAttributes: {
        editor: {
          style:
            'word-wrap: break-word; overflow-wrap: break-word; max-width: 100%; width: 100%; box-sizing: border-box;',
        },
      },
      // Configure link handling
      // styleSpecs: {
      //   link: {
      //     color: '#2563eb',
      //     textDecoration: 'underline',
      //     cursor: 'pointer'
      //   }
      // }
    });

    // Expose the editor instance to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        editor,
        replaceBlocks: (blocks: any[]) => {
          if (editor) {
            editor.replaceBlocks(editor.document, blocks);
          }
        },
      }),
      [editor]
    );

    // Store editor reference when available
    useEffect(() => {
      if (editor) {
        editorRef.current = editor;
      }
    }, [editor]);

    // Set document ID in comment system
    useEffect(() => {
      if (docId) {
        commentSystem.setDocumentId(docId);
      }
    }, [docId]);

    // Always update the comment system with the latest token
    useEffect(() => {
      if (token) {
        commentSystem.setToken(token);
      }
    }, [token]);

    const debouncedSave = useMemo(() => {
      return debounce(async () => {
        if (editor) {
          const documentSnapshot = editor.document;
          const documentString = JSON.stringify(documentSnapshot);
          console.log('debouncedSave called', {
            docId,
            sessionId,
            snapshot: documentSnapshot,
          });
          try {
            await APIService.updateArticleContent(docId, {
              snapshot: documentString,
              session_id: sessionId || '',
            });

            // Call the onSave callback if provided
            if (onSave) {
              onSave(documentSnapshot);
            }

            toast({
              title: 'Content saved',
              description: 'Your changes have been saved automatically.',
            });
          } catch (error) {
            console.error('Error saving content:', error);
            toast({
              title: 'Save failed',
              description: 'Failed to save your changes. Please try again.',
              variant: 'destructive',
            });
          }
        }
      }, 1000);
    }, [editor, docId, sessionId, onSave, token]);

    const saveDocument = useCallback(() => {
      debouncedSave();
    }, [debouncedSave]);

    // handleCommentButtonClick removed - comment functionality disabled in single-user app

    // Handle adding a new comment
    const handleCommentAdded = async (thread: any) => {
      setShowAddCommentPopup(false);

      // Add a comment marker to the content
      if (editorRef.current && thread.id) {
        addCommentMarkerToBlock(thread);

        // Defensive check for sessionId
        if (!sessionId) {
          toast({
            title: 'Session not ready',
            description:
              'Please wait for the session to initialize before saving.',
            variant: 'destructive',
          });
          return;
        }

        // 1. Update the document after thread creation
        try {
          const documentSnapshot = editorRef.current.document;
          const documentString = JSON.stringify(documentSnapshot);
          await APIService.updateArticleContent(docId, {
            snapshot: documentString,
            session_id: sessionId,
          });
          toast({
            title: 'Document updated',
            description:
              'The document was updated after adding a comment thread.',
          });
        } catch (error) {
          toast({
            title: 'Document update failed',
            description:
              'Failed to update the document after adding a comment thread.',
            variant: 'destructive',
          });
        }

        // 2. Fetch the thread again
        try {
          await commentSystem.getThread(thread.id);
          toast({
            title: 'Thread refreshed',
            description:
              'The comment thread was refreshed after document update.',
          });
        } catch (error) {
          toast({
            title: 'Thread refresh failed',
            description:
              'Failed to refresh the comment thread after document update.',
            variant: 'destructive',
          });
        }
      }
    };

    // Handle clicking on a comment marker
    const handleCommentMarkerClick = (threadId: string) => {
      setCurrentThreadId(threadId);
      setShowCommentThreadPopup(true);
    };

    const addCommentMarkerToBlock = async (thread: any) => {
      if (!editor) return;
      try {
        const selectedText = editor.getSelectedText();
        if (!selectedText) return;
        const selection = editor.getSelection();
        if (!selection) return;
        const commentMarker = {
          type: 'comment',
          props: {
            // New payload structure
            commentId: thread.id,
            commentedText: selectedText,
            // Keep old structure for backward compatibility
            text: selectedText,
            threadId: thread.id,
          },
        };
        // Cast as any for BlockNote API
        editor.insertInlineContent([commentMarker] as any);
        toast({
          title: 'Comment added',
          description: 'Your comment has been added successfully.',
        });
      } catch (error) {
        console.error('Error adding comment marker:', error);
      }
    };

    // extractSelectedContentWithFormatting and extractContentFromBlock removed - unused in single-user app

    // handleAIButtonClick removed - AI functionality disabled in single-user app

    // Handle document changes
    useEffect(() => {
      if (editor && onContentChange) {
        const handleChange = () => {
          if (isInitialLoad.current) return;
          const documentSnapshot = editor.document;
          // plainText removed - unused in single-user app
          // Full article content tracking removed for single-user app
          console.log('Editor content changed');
          onContentChange(documentSnapshot);
          saveDocument();
        };
        // Use correct event subscription
        const unsubscribe = (editor as any).on?.('update', handleChange);
        return () => {
          // Only unsubscribe, do NOT call saveDocument or onSave here
          if (typeof unsubscribe === 'function') unsubscribe();
        };
      }
    }, [editor, onContentChange, saveDocument]);

    // Function to validate and fix AI-generated content
    const validateAndFixAIContent = (content: any[]) => {
      if (!Array.isArray(content)) return content;

      // First pass: identify potential issues
      let hasHeadings = false;
      let hasParagraphs = false;
      let suspiciousHeadings = [];

      for (let i = 0; i < content.length; i++) {
        const block = content[i];
        if (block.type === 'heading') {
          hasHeadings = true;

          // Check for suspicious headings (long text that should be paragraphs)
          const text = extractTextFromContent(block.content || []);

          // Enhanced detection for paragraph-like content
          const isParagraphLike = (() => {
            // STRICT RULE: Headings should almost never end with sentence-ending punctuation
            if (
              (text.endsWith('.') ||
                text.endsWith('!') ||
                text.endsWith('?')) &&
              text.length > 10
            )
              return true;

            if (text.length > 250) return true;
            if (text.split('. ').length > 2) return true;

            const paragraphIndicators = [
              'we believe',
              'we provide',
              'we offer',
              'we ensure',
              'we help',
              'this means',
              'this allows',
              'this ensures',
              'this helps',
              'by ensuring',
              'by providing',
              'by offering',
              'by helping',
              'supporting',
              'enabling',
              'allowing',
              'ensuring',
              'agencies also',
              'companies also',
              'businesses also',
              'for more on',
              'for more information',
              'see comparison',
              'see resources',
              'such as',
              'including',
              'for example',
              'in addition',
              'furthermore',
              'moreover',
              'however',
              'therefore',
              'as a result',
              'in conclusion',
              'to learn more',
              'check out',
              'visit',
              'explore',
              'discover',
              'according to',
              'based on',
              'research shows',
              'studies indicate',
            ];
            const lowerText = text.toLowerCase();
            const hasIndicators = paragraphIndicators.some((indicator) =>
              lowerText.includes(indicator)
            );

            if (text.endsWith('.') && hasIndicators && text.length > 60)
              return true;
            if (
              (text.includes('—') || text.includes(' - ')) &&
              text.length > 80
            )
              return true;

            return false;
          })();

          if (isParagraphLike) {
            suspiciousHeadings.push(i);
          }
        }
        if (block.type === 'paragraph') {
          hasParagraphs = true;
        }
      }

      // If we have suspicious headings or no paragraphs but headings, apply more aggressive fixes
      if (
        (suspiciousHeadings.length > 0 || (hasHeadings && !hasParagraphs)) &&
        content.length > 0
      ) {
        console.log(
          '[BlockNoteEditor] Detected AI content formatting issues, applying fixes'
        );

        // Apply more aggressive preprocessing
        return content.map((block, index) => {
          // Convert suspicious headings to paragraphs
          if (block.type === 'heading') {
            const text = extractTextFromContent(block.content || []);

            // Enhanced logic: only convert if it's clearly paragraph content
            const shouldConvertToParagraph = (() => {
              // STRICT RULE: Headings should almost never end with sentence-ending punctuation
              if (
                (text.endsWith('.') ||
                  text.endsWith('!') ||
                  text.endsWith('?')) &&
                text.length > 10
              )
                return true;

              if (text.length > 250) return true;
              if (text.split('. ').length > 2) return true;

              const paragraphIndicators = [
                'we believe',
                'we provide',
                'we offer',
                'we ensure',
                'we help',
                'this means',
                'this allows',
                'this ensures',
                'this helps',
                'by ensuring',
                'by providing',
                'by offering',
                'by helping',
                'supporting',
                'enabling',
                'allowing',
                'ensuring',
                'agencies also',
                'companies also',
                'businesses also',
                'for more on',
                'for more information',
                'see comparison',
                'see resources',
                'such as',
                'including',
                'for example',
                'in addition',
                'furthermore',
                'moreover',
                'however',
                'therefore',
                'as a result',
                'in conclusion',
                'to learn more',
                'check out',
                'visit',
                'explore',
                'discover',
                'according to',
                'based on',
                'research shows',
                'studies indicate',
              ];
              const lowerText = text.toLowerCase();
              const hasIndicators = paragraphIndicators.some((indicator) =>
                lowerText.includes(indicator)
              );

              if (text.endsWith('.') && hasIndicators && text.length > 60)
                return true;
              if (
                (text.includes('—') || text.includes(' - ')) &&
                text.length > 80
              )
                return true;
              if (suspiciousHeadings.includes(index)) return true;

              return false;
            })();

            if (shouldConvertToParagraph) {
              console.log(
                `[BlockNoteEditor] Converting suspicious heading to paragraph: "${text.substring(
                  0,
                  40
                )}..."`
              );
              return {
                ...block,
                type: 'paragraph',
                props: {},
              };
            }
          }
          return block;
        });
      }

      return content;
    };

    // Function to process and fix links in content
    const processLinksInContent = (content: any[]) => {
      if (!Array.isArray(content)) return content;

      console.log('[BlockNoteEditor] Processing links in content:', content);

      return content.map((block) => {
        // Skip if not a paragraph or no content
        if (block.type !== 'paragraph' || !Array.isArray(block.content)) {
          return block;
        }

        // Process each content item in the paragraph
        const newContent = [];

        for (const item of block.content) {
          // If it's already a link, keep it but ensure proper structure
          if (item.type === 'link') {
            // Check if this is a markdown-style link [text](url)
            const isMarkdownLink =
              item.content &&
              Array.isArray(item.content) &&
              item.content.length > 0 &&
              item.content[0].text !== item.props?.href;

            // For markdown-style links, keep the display text and URL separate
            const linkItem = {
              ...item,
              props: {
                ...item.props,
                href: item.props?.href || '#',
              },
              // Keep the original content if it exists and is different from the href
              content: isMarkdownLink
                ? item.content
                : [
                    {
                      type: 'text',
                      text: item.props?.href || 'Link',
                      styles: {},
                    },
                  ],
            };

            newContent.push(linkItem);
            console.log('[BlockNoteEditor] Processed existing link:', linkItem);
            continue;
          }

          // If it's text, check for URLs and markdown-style links
          if (item.type === 'text' && item.text) {
            // First, check for markdown-style links [text](url)
            const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
            let text = item.text;
            let lastIndex = 0;
            let match;
            const parts = [];

            // Process markdown-style links first
            while ((match = markdownLinkRegex.exec(text)) !== null) {
              // Add text before the link
              if (match.index > lastIndex) {
                const beforeText = text.substring(lastIndex, match.index);
                if (beforeText) {
                  parts.push({
                    type: 'text',
                    text: beforeText,
                    styles: item.styles || {},
                  });
                }
              }

              // Extract the display text and URL
              const displayText = match[1];
              const url = match[2];

              // Add as a proper link with display text
              parts.push({
                type: 'link',
                content: [
                  {
                    type: 'text',
                    text: displayText,
                    styles: {},
                  },
                ],
                props: { href: url },
              });

              lastIndex = match.index + match[0].length;
            }

            // Add remaining text after the last markdown link
            if (lastIndex < text.length) {
              const remainingText = text.substring(lastIndex);

              // Now check for plain URLs in the remaining text
              if (remainingText) {
                const urlRegex = /(https?:\/\/[^\s\]]+)/g;
                let urlLastIndex = 0;
                let urlMatch;
                const urlParts = [];

                // Find all URLs in the remaining text
                while ((urlMatch = urlRegex.exec(remainingText)) !== null) {
                  // Add text before the URL
                  if (urlMatch.index > urlLastIndex) {
                    const beforeText = remainingText.substring(
                      urlLastIndex,
                      urlMatch.index
                    );
                    if (beforeText) {
                      urlParts.push({
                        type: 'text',
                        text: beforeText,
                        styles: item.styles || {},
                      });
                    }
                  }

                  // Clean up the URL (remove trailing punctuation)
                  let url = urlMatch[0];
                  let trailingPunctuation = '';

                  // Check for trailing punctuation that shouldn't be part of the URL
                  const trailingPunctuationRegex = /[.,;:!?)\]]+$/;
                  const punctuationMatch = url.match(trailingPunctuationRegex);
                  if (punctuationMatch) {
                    trailingPunctuation = punctuationMatch[0];
                    url = url.slice(0, -trailingPunctuation.length);
                  }

                  // Add the URL as a link
                  const linkItem = {
                    type: 'link',
                    content: [
                      {
                        type: 'text',
                        text: url,
                        styles: {},
                      },
                    ],
                    props: {
                      href: url,
                      originalHref: url, // Store original for recovery
                      originalUrl: url, // Alternative storage
                    },
                  };
                  urlParts.push(linkItem);
                  console.log(
                    '[BlockNoteEditor] Created new link from URL:',
                    linkItem
                  );

                  // Add trailing punctuation as separate text if any
                  if (trailingPunctuation) {
                    urlParts.push({
                      type: 'text',
                      text: trailingPunctuation,
                      styles: item.styles || {},
                    });
                  }

                  urlLastIndex = urlMatch.index + urlMatch[0].length;
                }

                // Add remaining text after the last URL
                if (urlLastIndex < remainingText.length) {
                  const finalText = remainingText.substring(urlLastIndex);
                  if (finalText) {
                    urlParts.push({
                      type: 'text',
                      text: finalText,
                      styles: item.styles || {},
                    });
                  }
                }

                // Add all URL parts to the main parts array
                if (urlParts.length > 0) {
                  parts.push(...urlParts);
                } else {
                  // If no URLs found, add the remaining text as is
                  parts.push({
                    type: 'text',
                    text: remainingText,
                    styles: item.styles || {},
                  });
                }
              }
            }

            // If we found URLs, use the parts; otherwise, keep the original item
            if (parts.length > 0) {
              newContent.push(...parts);
            } else {
              newContent.push(item);
            }
          } else {
            newContent.push(item);
          }
        }

        const processedBlock = {
          ...block,
          content: newContent,
        };

        console.log(
          '[BlockNoteEditor] Processed block with links:',
          processedBlock
        );
        return processedBlock;
      });
    };

    // Function to process markdown-style links in the initial content
    const processMarkdownLinks = (content: any[]) => {
      if (!Array.isArray(content)) return content;

      return content.map((block) => {
        if (!block.content || !Array.isArray(block.content)) return block;

        // Process each content item to find markdown-style links
        const newContent = [];

        for (const item of block.content) {
          if (item.type === 'text' && item.text) {
            // Look for markdown-style links [text](url)
            const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
            let text = item.text;
            let lastIndex = 0;
            let match;
            const parts = [];

            // Find all markdown-style links
            while ((match = markdownLinkRegex.exec(text)) !== null) {
              // Add text before the link
              if (match.index > lastIndex) {
                parts.push({
                  type: 'text',
                  text: text.substring(lastIndex, match.index),
                  styles: item.styles || {},
                });
              }

              // Extract display text and URL
              const displayText = match[1];
              const url = match[2];

              // Create proper link node
              parts.push({
                type: 'link',
                content: [
                  {
                    type: 'text',
                    text: displayText,
                    styles: {},
                  },
                ],
                props: { href: url },
              });

              lastIndex = match.index + match[0].length;
            }

            // Add remaining text
            if (lastIndex < text.length) {
              parts.push({
                type: 'text',
                text: text.substring(lastIndex),
                styles: item.styles || {},
              });
            }

            // Add all parts or original item
            if (parts.length > 0) {
              newContent.push(...parts);
            } else {
              newContent.push(item);
            }
          } else {
            newContent.push(item);
          }
        }

        return {
          ...block,
          content: newContent,
        };
      });
    };

    // Load initial content
    useEffect(() => {
      if (editor && initialContent) {
        try {
          isInitialLoad.current = true;
          // Log the raw initialContent
          console.log('[BlockNoteEditor] Raw initialContent:', initialContent);

          // Advanced normalization and preprocessing
          let processedContent = initialContent;

          // Apply standard preprocessing
          processedContent = preprocessMarkdownContent(processedContent);
          processedContent = normalizeBlockTypes(processedContent);

          // Apply additional AI content validation and fixes
          processedContent = validateAndFixAIContent(processedContent);

          // Process markdown-style links in the content
          processedContent = processMarkdownLinks(processedContent);

          // Process and fix links in content
          processedContent = processLinksInContent(processedContent);

          // Log the processed content
          console.log(
            '[BlockNoteEditor] Processed initialContent:',
            processedContent
          );

          editor.replaceBlocks(editor.document, processedContent);

          // plainText removed - unused in single-user app
          // Full article content tracking removed for single-user app

          // After initial content is loaded, set flag to false
          setTimeout(() => {
            isInitialLoad.current = false;
          }, 0);
        } catch (error) {
          console.error('Error loading initial content:', error);
          isInitialLoad.current = false;
        }
      }
    }, [editor]);

    // Handle comment marker clicks and link clicks
    useEffect(() => {
      const handleClickOnCommentMarkers = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // Handle old data-comment-marker attribute for backward compatibility
        if (target && target.hasAttribute('data-comment-marker')) {
          const threadId = target.getAttribute('data-thread-id');
          if (threadId) {
            e.preventDefault();
            e.stopPropagation();
            handleCommentMarkerClick(threadId);
          }
        }
        // Handle new data-comment-id attribute
        if (target && target.hasAttribute('data-comment-id')) {
          const commentId = target.getAttribute('data-comment-id');
          if (commentId) {
            e.preventDefault();
            e.stopPropagation();
            handleCommentMarkerClick(commentId);
          }
        }
      };

      // Handle the new showComment custom event from CommentMarker
      const handleShowComment = (e: CustomEvent) => {
        const { commentId } = e.detail;
        if (commentId) {
          handleCommentMarkerClick(commentId);
        }
      };

      const handleLinkClicks = (e: MouseEvent) => {
        const target = e.target as HTMLElement;

        // Check if the clicked element is a link or inside a link
        let linkElement = target.closest('a');
        if (!linkElement) {
          // Check for BlockNote link elements
          linkElement = target.closest(
            '[data-content-type="link"]'
          ) as HTMLAnchorElement;
        }

        if (linkElement) {
          const href =
            linkElement.getAttribute('href') ||
            linkElement.getAttribute('data-href') ||
            linkElement.textContent;

          if (
            href &&
            (href.startsWith('http://') || href.startsWith('https://'))
          ) {
            e.preventDefault();
            e.stopPropagation();
            window.open(href, '_blank', 'noopener,noreferrer');
          }
        }
      };

      document.addEventListener('click', handleClickOnCommentMarkers);
      document.addEventListener('click', handleLinkClicks);
      window.addEventListener(
        'showComment',
        handleShowComment as EventListener
      );

      return () => {
        document.removeEventListener('click', handleClickOnCommentMarkers);
        document.removeEventListener('click', handleLinkClicks);
        window.removeEventListener(
          'showComment',
          handleShowComment as EventListener
        );
      };
    }, []);

    // Enhanced: Remove all comment markers for a given threadId and restore plain text in BlockNote, with logging and fallback for content
    const removeCommentMarkersByThreadId = (threadId: string) => {
      if (!editor) return;
      const blocks = editor.document;
      let changed = false;
      const newBlocks = blocks.map((block: any, idx: number) => {
        let blockChanged = false;
        // Try inlineContent first
        if (block.inlineContent) {
          console.log(`Block[${idx}] inlineContent:`, block.inlineContent);
          const newInlineContent: any[] = [];
          block.inlineContent.forEach((inline: any) => {
            if (
              inline.type === 'comment' &&
              (inline.props?.threadId === threadId ||
                inline.props?.commentId === threadId)
            ) {
              // Handle both old and new prop structures
              const textToRestore =
                inline.props?.commentedText || inline.props?.text;
              if (textToRestore) {
                newInlineContent.push({
                  type: 'text',
                  text: textToRestore,
                  styles: {},
                });
                changed = true;
                blockChanged = true;
                console.log(
                  `Removed comment marker from inlineContent in block[${idx}]`
                );
              }
            } else {
              newInlineContent.push(inline);
            }
          });
          if (newInlineContent.length !== block.inlineContent.length) {
            return { ...block, inlineContent: newInlineContent };
          }
        }
        // Fallback: Try content array (legacy/other structure)
        if (block.content && Array.isArray(block.content)) {
          console.log(`Block[${idx}] content:`, block.content);
          const contentIndex = block.content.findIndex(
            (content: any) =>
              content.type === 'comment' &&
              content.props &&
              (content.props.threadId === threadId ||
                content.props.commentId === threadId)
          );
          if (contentIndex !== -1) {
            const updatedContent = [...block.content];
            updatedContent.splice(contentIndex, 1);
            // Handle both old and new prop structures
            const markerText =
              block.content[contentIndex].props.commentedText ||
              block.content[contentIndex].props.text;
            if (markerText) {
              updatedContent.splice(contentIndex, 0, {
                type: 'text',
                text: markerText,
                styles: {},
              });
            }
            changed = true;
            blockChanged = true;
            console.log(`Removed comment marker from content in block[${idx}]`);
            return { ...block, content: updatedContent };
          }
        }
        if (!blockChanged) {
          console.log(
            `No marker found in block[${idx}] for threadId`,
            threadId
          );
        }
        return block;
      });
      if (changed) {
        editor.replaceBlocks(editor.document, newBlocks);
        saveDocument();
        console.log('Removed comment marker(s) and saved document.');
      } else {
        console.log('No comment markers removed for threadId', threadId);
      }
    };

    // Register the apply handler - Removed chat functionality
    // useEffect(() => {
    //   useAIAssistantStore.getState().setOnApplyAIResult((text: string) => {
    //     const selection = editor.getSelection();
    //     const aiSelectionInfo = useAIAssistantStore.getState().aiSelectionInfo;

    //     if (
    //       selection &&
    //       selection.blocks &&
    //       selection.blocks.length > 0 &&
    //       aiSelectionInfo
    //     ) {
    //       console.log('Applying AI result:', text);
    //       console.log('Selection info:', aiSelectionInfo);
    //       console.log('Current selection:', selection);

    //       // Get the selected text that was originally sent to AI
    //       const originalSelectedText = editor.getSelectedText();
    //       console.log('Original selected text:', originalSelectedText);

    //       if (selection.blocks.length === 1 && originalSelectedText) {
    //         // Single block selection - replace only the selected portion
    //         const block = selection.blocks[0];
    //         const updatedBlock = replaceSelectedTextInBlock(
    //           block,
    //           originalSelectedText,
    //           text
    //         );

    //         if (updatedBlock) {
    //           const allBlocks = editor.document;
    //           const updatedBlocks = allBlocks.map((b: any) =>
    //             b.id === block.id ? updatedBlock : b
    //           );
    //           editor.replaceBlocks(allBlocks, updatedBlocks as any);
    //         }
    //       } else {
    //         // Multi-block selection or fallback - use original logic
    //         const newBlocks = markdownToBlocks(text);
    //         const allBlocks = editor.document;
    //         const selectedIds = selection.blocks.map((b) => b.id);

    //         const mappedNewBlocks = newBlocks.map((block, idx) => ({
    //           ...block,
    //           id: selectedIds[idx] || generateBlockId(),
    //         }));

    //         let replaced = 0;
    //         const updatedBlocks = allBlocks.flatMap((block: any) => {
    //           if (selectedIds.includes(block.id)) {
    //             replaced++;
    //             return replaced <= mappedNewBlocks.length
    //               ? [mappedNewBlocks[replaced - 1]]
    //               : [];
    //           }
    //           return [block];
    //         });

    //         if (mappedNewBlocks.length > selectedIds.length) {
    //           const lastIdx = allBlocks.findIndex(
    //             (b) => b.id === selectedIds[selectedIds.length - 1]
    //           );
    //           updatedBlocks.splice(
    //             lastIdx + 1,
    //             0,
    //             ...mappedNewBlocks.slice(selectedIds.length)
    //           );
    //         }

    //         editor.replaceBlocks(allBlocks, updatedBlocks as any);
    //       }
    //     } else {
    //       console.log(
    //         '[AI Apply] Handler called but editor or selection missing'
    //       );
    //     }
    //   });
    //   // Cleanup on unmount
    //   return () => {
    //     useAIAssistantStore.getState().setOnApplyAIResult(undefined);
    //   };
    // }, [editor]); // Removed chat functionality

    // Block rendering if sessionId is not ready
    if (!sessionId) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">
              Initializing session...
            </div>
            <div className="text-muted-foreground">
              Please wait, your editing session is being prepared.
            </div>
          </div>
        </div>
      );
    }

    if (!activeUser) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">
              Authentication Required
            </div>
            <div className="text-muted-foreground">
              Please log in to use the editor.
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="blocknote-editor-container" ref={editorContainerRef}>
        <style>
          {`
            .blocknote-editor-container a,
            .blocknote-editor-container [data-content-type="link"],
            .blocknote-editor-container .bn-inline-content[data-content-type="link"],
            .blocknote-editor-container .ProseMirror a {
              color: #2563eb !important;
              text-decoration: underline !important;
              cursor: pointer !important;
              border: none !important;
              background: none !important;
            }
            
            .blocknote-editor-container a:hover,
            .blocknote-editor-container [data-content-type="link"]:hover,
            .blocknote-editor-container .bn-inline-content[data-content-type="link"]:hover,
            .blocknote-editor-container .ProseMirror a:hover {
              color: #1d4ed8 !important;
              text-decoration: underline !important;
              background: rgba(37, 99, 235, 0.1) !important;
            }
            
            .blocknote-editor-container .ProseMirror .bn-inline-content {
              display: inline;
            }
            
            .blocknote-editor-container .ProseMirror .bn-inline-content[data-content-type="link"] {
              color: #2563eb !important;
              text-decoration: underline !important;
              cursor: pointer !important;
            }
            
            /* Ensure markdown-style links display correctly */
            .blocknote-editor-container .ProseMirror a[href] {
              color: #2563eb !important;
              text-decoration: underline !important;
              cursor: pointer !important;
            }
            
            /* Fix for links with display text */
            .blocknote-editor-container .ProseMirror a[href] * {
              color: inherit !important;
              text-decoration: inherit !important;
            }
          `}
        </style>
        <BlockNoteView
          editor={editor}
          theme={lightTheme}
          formattingToolbar={false}
          onChange={saveDocument}
        >
          <FormattingToolbarController
            formattingToolbar={() => (
              <CustomFormattingToolbar />
            )}
          />
          {/* No fixed CustomFormattingToolbar here! */}
        </BlockNoteView>

        {/* Add Comment Popup */}
        {showAddCommentPopup && (
          <AddCommentPopup
            selectedText={commentData.selectedText}
            block={commentData.block}
            onClose={() => setShowAddCommentPopup(false)}
            onCommentAdded={handleCommentAdded}
            docId={docId}
          />
        )}

        {/* Comment Thread Popup */}
        {showCommentThreadPopup && currentThreadId && (
          <CommentThreadPopup
            threadId={currentThreadId}
            onClose={() => {
              setShowCommentThreadPopup(false);
              setCurrentThreadId(null);
            }}
            activeUser={activeUser}
            docId={docId}
            removeCommentMarkersByThreadId={removeCommentMarkersByThreadId}
          />
        )}
      </div>
    );
  }
);
