import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import {
  FormattingToolbarController,
  useCreateBlockNote,
} from '@blocknote/react';
import { debounce } from 'lodash';
// Collaboration imports removed for single-user mode
// import { useYDoc, useYjsProvider } from '@y-sweet/react';
import { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { CustomFormattingToolbar } from './CustomFormattingToolbar';
import { BlockNoteSchema, defaultInlineContentSpecs } from '@blocknote/core';
// Comment imports removed for single-user mode
import APIService from '@/lib/services/APIService';
import { useSessionStore } from '@/lib/store/session-store';

// Define light theme for editor
const lightTheme = {
  colors: {
    editor: {
      text: '#333333',
      background: '#ffffff',
    },
    menu: {
      text: '#333333',
      background: '#ffffff',
    },
    tooltip: {
      text: '#333333',
      background: '#ffffff',
    },
    hovered: {
      text: '#333333',
      background: '#f5f5f5',
    },
    selected: {
      text: '#333333',
      background: '#e8e8e8',
    },
    disabled: {
      text: '#adadad',
      background: '#f5f5f5',
    },
    shadow: 'rgba(0, 0, 0, 0.1)',
    border: '#e0e0e0',
  },
  borderRadius: 6,
  fontFamily: 'inherit',
};

interface BlockNoteEditorProps {
  docId: string;
  initialContent?: any;
  onContentChange?: (content: any) => void;
  onSave?: (content: any) => void;
}

function extractTextFromContent(content: any[]): string {
  return content
    .map((item) => {
      if (item.type === 'text') {
        return item.text || '';
      } else if (item.type === 'link') {
        return item.content
          ? item.content.map((c: any) => c.text || '').join('')
          : item.text || '';
      }
      return '';
    })
    .join('');
}

function normalizeBlockTypes(blocks: any[]) {
  return blocks.map((block) => {
    if (block.type === 'paragraph' && block.content) {
      const text = extractTextFromContent(block.content);
      if (text.trim() === '') {
        return { ...block, type: 'paragraph' };
      }
    }
    return block;
  });
}

function preprocessMarkdownContent(content: any[]) {
  if (!Array.isArray(content)) {
    console.warn('[BlockNoteEditor] Content is not an array:', content);
    return [];
  }

  return content.map((block, index) => {
    // Handle different block structures
    if (typeof block === 'string') {
      return {
        id: `block-${index}`,
        type: 'paragraph',
        props: {},
        content: [{ type: 'text', text: block, styles: {} }],
        children: [],
      };
    }

    // Ensure block has required properties
    const processedBlock = {
      id: block.id || `block-${index}`,
      type: block.type || 'paragraph',
      props: block.props || {},
      content: block.content || [],
      children: block.children || [],
    };

    // Process content array
    if (Array.isArray(processedBlock.content)) {
      processedBlock.content = processedBlock.content.map((contentItem) => {
        if (typeof contentItem === 'string') {
          return {
            type: 'text',
            text: contentItem,
            styles: {},
          };
        }
        return contentItem;
      });
    }

    return processedBlock;
  });
}

// generateBlockId function removed - unused in single-user app

export const BlockNoteEditor = forwardRef<any, BlockNoteEditorProps>(
  ({ docId, initialContent, onContentChange }, ref) => {
    // Comment-related state removed for single-user version
    const [_selectedText] = useState('');
    // AI assistant functionality removed
    const [_selectedBlocks] = useState<any[] | null>(null);

    const editorContainerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);
    const sessionId = useSessionStore((state) => state.sessionId);

    const isInitialLoad = useRef(true);

    // Collaboration providers removed for single-user mode
    // const provider = useYjsProvider();
    // const doc = useYDoc();

    const schema = BlockNoteSchema.create({
      inlineContentSpecs: {
        ...defaultInlineContentSpecs,
        // comment: CommentMarker, // Removed for single-user mode
      },
    });


    const editor = useCreateBlockNote({
      schema,
      initialContent: initialContent,
      // Collaboration removed for single-user mode
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
        },
      },
      domAttributes: {
        editor: {
          style:
            'word-wrap: break-word; overflow-wrap: break-word; max-width: 100%; width: 100%; box-sizing: border-box;',
        },
      },
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

    // Load initial content
    useEffect(() => {
      if (editor && initialContent && Array.isArray(initialContent) && initialContent.length > 0) {
        try {
          isInitialLoad.current = true;
          console.log('[BlockNoteEditor] Loading initial content:', initialContent);

          // Apply preprocessing
          let processedContent = preprocessMarkdownContent(initialContent);
          processedContent = normalizeBlockTypes(processedContent);

          console.log('[BlockNoteEditor] Processed initial content:', processedContent);

          editor.replaceBlocks(editor.document, processedContent);
          console.log('[BlockNoteEditor] Initial content loaded successfully');
        } catch (error) {
          console.error('[BlockNoteEditor] Error loading initial content:', error);
        } finally {
          // Allow content changes after initial load
          setTimeout(() => {
            isInitialLoad.current = false;
          }, 100);
        }
      }
    }, [editor, initialContent]);

    // Save document function
    const saveDocument = useCallback(
      debounce(async () => {
        if (!editor || !sessionId || isInitialLoad.current) return;

        try {
          const documentSnapshot = editor.document;
          const documentString = JSON.stringify(documentSnapshot);
          await APIService.updateArticleContent(docId, {
            snapshot: documentString,
            session_id: sessionId,
          });
          console.log('[BlockNoteEditor] Document saved successfully');
        } catch (error) {
          console.error('[BlockNoteEditor] Error saving document:', error);
        }
      }, 1000),
      [editor, docId, sessionId]
    );

    // Handle document changes
    useEffect(() => {
      if (editor && onContentChange) {
        const handleChange = () => {
          if (isInitialLoad.current) return;
          const documentSnapshot = editor.document;
          console.log('Editor content changed');
          onContentChange(documentSnapshot);
          // Only save if there's actual user interaction, not programmatic changes
          // saveDocument(); // Removed automatic save to prevent duplicate versions
        };
        // Use correct event subscription
        const unsubscribe = (editor as any).on?.('update', handleChange);
        return () => {
          if (typeof unsubscribe === 'function') unsubscribe();
        };
      }
    }, [editor, onContentChange, saveDocument]);

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

    return (
      <div className="blocknote-editor-container" ref={editorContainerRef}>
        <style>
          {`
            .blocknote-editor-container a,
            .blocknote-editor-container [data-content-type="link"],
            .blocknote-editor-container .ProseMirror a {
              color: #2563eb !important;
              text-decoration: underline !important;
              cursor: pointer !important;
            }
            
            .blocknote-editor-container a:hover,
            .blocknote-editor-container [data-content-type="link"]:hover,
            .blocknote-editor-container .ProseMirror a:hover {
              color: #1d4ed8 !important;
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
        </BlockNoteView>

        {/* Comment popups removed for single-user version */}
      </div>
    );
  }
);
