import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  PartialBlock,
  BlockNoteSchema,
  defaultInlineContentSpecs,
  defaultStyleSpecs,
} from '@blocknote/core';
import {
  FormattingToolbarController,
  useCreateBlockNote,
} from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/react/style.css';
import { Button } from '@/components/ui/button';

import {
  Undo,
  Redo,
  ArrowLeft,
  PanelRight,
  PanelLeft,
  SpellCheck,
  Focus,
} from 'lucide-react';
import { CustomFormattingToolbar } from '@/components/editor/CustomFormattingToolbar';
// Comment-related imports removed for single-user application
import {
  getArticleEditorContent,

} from '@/lib/services/topics.service';
import { useParams, useNavigate } from 'react-router-dom';
// TimeLogger removed for single-user application

// import { useAIAssistantStore } from '@/stores/ai-assistant-store'; // Removed chat functionality
import { useSessionStore } from '@/lib/store/session-store';
import { debounce } from 'lodash';
import APIService from '@/lib/services/APIService';
import useEditor from '../hooks/useEditor';
// import { markdownToBlocks } from '@/lib/blocknote.util'; // Removed for single-user app
import { SaveIndicator } from './SaveIndicator';
import { AIHighlight } from './markers/AiHighlightMarker';
import { IssueMarker } from './markers/IssueMarker';
import { FloatingIssueTooltip } from '@/modules/editor/components/FloatingIssueTooltip';
import { FloatingGrammarTooltip } from '@/modules/editor/components/FloatingGrammarTooltip';
import { GrammarMarker } from './markers/GrammarMarker';
import { useGrammarChecking } from '../hooks/useGrammarChecking';

export const EditorContent: React.FC = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const {
    settings,
    updateSettings,
    toggleLeftSidebar,
    toggleRightSidebar,
    rightSidebarSection,
    saveStatus,
    saveError,
    setSaveStatus,
    setEditorRef,
    isPreviewMode,

  } = useEditor();
  const [articleContent, setArticleContent] = useState<PartialBlock[] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);


  // Use ref to track preview mode synchronously to prevent race conditions
  const isPreviewModeRef = useRef(false);

  // Update ref whenever preview mode changes
  useEffect(() => {
    isPreviewModeRef.current = isPreviewMode;
  }, [isPreviewMode]);

  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // AI Assistant store - Removed chat functionality
  // const selectedContentNodes = useAIAssistantStore(
  //   (s) => s.selectedContentNodes
  // );
  // const setOnEditorAIButtonClick = useAIAssistantStore(
  //   (s) => s.setOnEditorAIButtonClick
  // );
  // const setOnApplyAIResult = useAIAssistantStore((s) => s.setOnApplyAIResult);
  const sessionId = useSessionStore((state) => state.sessionId);

  const editorContainerRef = React.useRef<HTMLDivElement>(null);

  // Track current AI highlighted selection - support multiple blocks
  const [currentAISelection, setCurrentAISelection] = useState<{
    blockIds: string[];
    start: number;
    end: number;
  } | null>(null);

  const schema = BlockNoteSchema.create({
    inlineContentSpecs: {
      ...defaultInlineContentSpecs,
      issue: IssueMarker,
      grammar: GrammarMarker,
    },
    styleSpecs: {
      ...defaultStyleSpecs,
      aiHighlight: AIHighlight,
    },
  });

  // Function to load content
  const loadContent = useCallback(async () => {
    if (!articleId) return;

    try {
      setIsLoading(true);

      // Load latest content
      const content = await getArticleEditorContent(articleId);

      // Parse the snapshot_data which should always be a JSON string
      if (content.snapshot_data) {
        try {
          let jsonString = '';
          if (typeof content.snapshot_data === 'string') {
            // Check if it's base64 encoded (starts with base64 characters and doesn't look like JSON)
            if (content.snapshot_data.match(/^[A-Za-z0-9+/]+=*$/) && !content.snapshot_data.startsWith('[') && !content.snapshot_data.startsWith('{')) {
              try {
                jsonString = atob(content.snapshot_data);
              } catch (base64Error) {
                console.warn('Failed to decode base64, treating as plain string:', base64Error);
                jsonString = content.snapshot_data;
              }
            } else {
              jsonString = content.snapshot_data;
            }
          } else if ((content.snapshot_data as any).data) {
            const buffer = new Uint8Array((content.snapshot_data as any).data);
            jsonString = new TextDecoder().decode(buffer);
          }
          
          const parsed = JSON.parse(jsonString);
          isUpdatingContentRef.current = true;
          setArticleContent(parsed);
  
          setTimeout(() => {
            isUpdatingContentRef.current = false;
          }, 500);
        } catch (parseError) {
          console.error('Failed to parse editor content JSON:', parseError);
          setError('Failed to parse editor content. The content may be corrupted.');
        }
      } else {
        console.error('No snapshot_data received from server');
        setError('No content data received from server.');
      }
    } catch (error: any) {
      console.error('Error fetching editor content:', error);
      setError(error.message || 'Failed to load editor content');
    } finally {
      setIsLoading(false);
    }
  }, [articleId]);

  // Load article content and versions
  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Focus event handler removed to prevent unnecessary content reloads
  // that were causing multiple version saves when switching tabs



  // Create editor only once - don't recreate when content changes
  const editor = useCreateBlockNote(
    {
      schema,
      initialContent: undefined, // Start with empty content
    },
    [] // Empty dependency array - create editor only once
  );

  // Track if we're updating content programmatically to prevent saves
  const isUpdatingContentRef = useRef(false);

  // Update editor content when articleContent changes (without recreating editor)
  useEffect(() => {
    if (editor && articleContent) {
      // Set flag to prevent saves during programmatic content update
      isUpdatingContentRef.current = true;
      
      // Use replaceBlocks to update content without triggering onChange
      editor.replaceBlocks(editor.document, articleContent);
      
      // Reset flag after a longer delay to ensure saves are prevented during content loading
      setTimeout(() => {
        isUpdatingContentRef.current = false;
      }, 500);
    }
  }, [editor, articleContent]);

  // Use custom grammar checking hook
  const {
    initializeGrammarChecking,
    isChecking: isGrammarChecking,
    isReady: isGrammarReady,
  } = useGrammarChecking();

  // Grammar checking functionality
  const applyGrammarMarkers = useCallback(async () => {
    if (!editor || !isGrammarReady) {
      return;
    }

    try {
      await initializeGrammarChecking();
    } catch (error) {
      console.error('Error during grammar checking:', error);
      // Don't show user-facing errors for grammar checking, just log them
    }
  }, [editor, isGrammarReady, initializeGrammarChecking]);

  // Function to toggle grammar checking
  // Register editor reference with the context
  useEffect(() => {
    if (editor && setEditorRef) {
      setEditorRef({ current: editor });
    }
  }, [editor, setEditorRef]);

  // Comment keyboard shortcuts removed for single-user application

  // Handle grammar marker clicks
  useEffect(() => {
    // Grammar marker interactions are now handled by FloatingGrammarTooltip component
    // which uses mouseenter/mouseleave events for better UX
  }, []);

  // Helper function to remove AI highlight from specific selection - support multiple blocks
  const removeAIHighlightFromSelection = useCallback(
    (selectionInfo: { blockIds: string[]; start: number; end: number }) => {
      if (!editor) return;

      try {
        const allBlocks = editor.document;
        let hasChanges = false;

        // Update all blocks that have AI highlights
        const updatedBlocks = allBlocks.map((block: any) => {
          if (selectionInfo.blockIds.includes(block.id)) {
            if (block.content && Array.isArray(block.content)) {
              // Remove AI highlight from the specific text range
              const updatedContent = block.content.map((node: any) => {
                if (node.styles && node.styles.aiHighlight) {
                  hasChanges = true;
                  const { aiHighlight, ...otherStyles } = node.styles;
                  return {
                    ...node,
                    styles: otherStyles,
                  };
                }
                return node;
              });

              return { ...block, content: updatedContent };
            }
          }
          return block;
        });

        // Only update if there were actual changes
        if (hasChanges) {
          editor.replaceBlocks(allBlocks, updatedBlocks as any);
        }
      } catch (error) {
        console.warn(
          'Could not remove AI highlight from specific selection:',
          error
        );
      }
    },
    [editor]
  );

  // Set up AI assistant handlers
  useEffect(() => {
    if (!editor) return;

    // handleAIButtonClick removed - AI functionality not available in single-user application

    // handleApplyAIResult removed - AI functionality not available in single-user application

    // setOnEditorAIButtonClick(handleAIButtonClick);
    // setOnApplyAIResult(handleApplyAIResult);

    // return () => {
    //   setOnEditorAIButtonClick(undefined);
    //   setOnApplyAIResult(undefined);
    // }; // Removed chat functionality
  }, [
    editor,
    // selectedContentNodes, // Removed chat functionality
    toggleRightSidebar,
    // setOnEditorAIButtonClick, // Removed chat functionality
    // setOnApplyAIResult, // Removed chat functionality
    currentAISelection,
    removeAIHighlightFromSelection,
  ]);

  const editorStyle = useMemo(
    () => ({
      fontFamily: settings.typography.fontFamily,
      fontSize: `${settings.typography.fontSize}px`,
      lineHeight: settings.typography.lineHeight,
      '--block-spacing': `${settings.typography.blockSpacing}em`,
    }),
    [settings.typography]
  );

  // Text selection for comments removed for single-user application

  // Update word and character count, and track selection state
  useEffect(() => {
    if (!editor) return;

    const updateCounts = () => {
      const content = editor.document;
      let words = 0;
      let chars = 0;

      const countInBlocks = (blocks: any[]) => {
        blocks.forEach((block) => {
          if (block.content) {
            if (typeof block.content === 'string') {
              const text = block.content.trim();
              chars += text.length;
              if (text) {
                words += text.split(/\s+/).length;
              }
            } else if (Array.isArray(block.content)) {
              block.content.forEach((item: any) => {
                if (typeof item === 'string') {
                  chars += item.length;
                  if (item.trim()) {
                    words += item.trim().split(/\s+/).length;
                  }
                } else if (item.text) {
                  chars += item.text.length;
                  if (item.text.trim()) {
                    words += item.text.trim().split(/\s+/).length;
                  }
                }
              });
            }
          }
          if (block.children) {
            countInBlocks(block.children);
          }
        });
      };

      countInBlocks(content);
      setWordCount(words);
      setCharCount(chars);
    };

    updateCounts();

    // Listen for editor changes and selection changes
    const unsubscribe = editor.onChange(() => {
      updateCounts();
      // Temporarily disable automatic grammar checking to debug the issue
      // TODO: Re-enable this once the covering text issue is fixed
      /*
      if (isGrammarCheckEnabled && isGrammarReady) {
        setTimeout(() => {
          applyGrammarMarkers();
        }, 500);
      }
      */
    });

    // Track selection changes to manage AI highlights and comments
    const handleSelectionChange = () => {
      const selection = editor.getSelection();
      const selectedText = editor.getSelectedText();

      // Comment selection handling removed for single-user application

      // If there's a current AI selection and the user selects different text
      if (currentAISelection && selection && selectedText) {
        const currentSelectionBlockIds = selection.blocks.map(
          (block: any) => block.id
        );

        // Check if the selection has changed to different blocks
        const selectionChanged =
          currentSelectionBlockIds.length !==
            currentAISelection.blockIds.length ||
          !currentSelectionBlockIds.every(
            (id, index) => id === currentAISelection.blockIds[index]
          );

        if (selectionChanged) {
          // Remove AI highlight from previous selection
          removeAIHighlightFromSelection(currentAISelection);
          setCurrentAISelection(null);
        }
      }

      // If no text is selected and there's an AI highlight, remove it
      if (!selectedText && currentAISelection) {
        removeAIHighlightFromSelection(currentAISelection);
        setCurrentAISelection(null);
      }
    };

    // Listen for selection changes
    const selectionUnsubscribe = editor.onSelectionChange(
      handleSelectionChange
    );

    return () => {
      unsubscribe?.();
      selectionUnsubscribe?.();
    };
  }, [
    editor,
    currentAISelection,
    removeAIHighlightFromSelection,
    // handleTextSelection removed for single-user application
    isGrammarReady,
    applyGrammarMarkers,
  ]);



  const debouncedSave = useMemo(() => {
    return debounce(async () => {
      // Don't save if there's an active text selection, in preview mode, or updating content programmatically
      if (
        editor &&
        !editor.getSelectedText() &&
        !isPreviewMode &&
        !isUpdatingContentRef.current
      ) {
        setSaveStatus('saving');
        const documentSnapshot = editor.document;

        // Convert inline issue markers to plain text before saving
        const sanitizeIssueMarkersForSave = (blocks: any[]): any[] => {
          const sanitizeNodesArray = (nodes: any[]): any[] => {
            return nodes.map((node) => {
              // Strings or plain text nodes
              if (typeof node === 'string') return node;
              if (!node || typeof node !== 'object') return node;

              // If this is an inline issue marker, convert to plain text
              if (['issue', 'grammar'].includes(node.type)) {
                const textValue =
                  node?.props?.originalText ?? node?.props?.suggestion ?? '';
                return {
                  type: 'text',
                  text: textValue,
                  styles: {},
                };
              }

              return node;
            });
          };

          const sanitizeBlock = (block: any): any => {
            if (!block || typeof block !== 'object') return block;

            const newBlock: any = { ...block };

            if (Array.isArray(block.content)) {
              newBlock.content = sanitizeNodesArray(block.content);
            }

            // Some structures may use inlineContent in addition to content
            if (Array.isArray((block as any).inlineContent)) {
              newBlock.inlineContent = sanitizeNodesArray(
                (block as any).inlineContent
              );
            }

            if (Array.isArray(block.children)) {
              newBlock.children = sanitizeIssueMarkersForSave(block.children);
            }

            return newBlock;
          };

          return blocks.map(sanitizeBlock);
        };

        const sanitizedSnapshot = Array.isArray(documentSnapshot)
          ? sanitizeIssueMarkersForSave(documentSnapshot as any[])
          : documentSnapshot;

        const documentString = JSON.stringify(sanitizedSnapshot);
        try {
          await APIService.updateArticleContent(articleId ?? '', {
            snapshot: documentString,
            session_id: sessionId || '',
          });
          setSaveStatus('saved');
        } catch (error: any) {
          console.error('Error saving content:', error);
          setSaveStatus('error', error.message || 'Failed to save changes');
        }
      }
    }, 1000);
  }, [editor, sessionId, setSaveStatus, isPreviewMode]);

  const saveDocument = useCallback(() => {
    setTimeout(() => {
      // Additional check to prevent saves during content loading/updating
      if (!isPreviewModeRef.current && !isUpdatingContentRef.current && !isLoading) {
        debouncedSave();
      }
    }, 0);
  }, [debouncedSave, isLoading]);

  // Helper function to replace selected text within a block - Removed for single-user app
  // const replaceSelectedTextInBlock = (
  //   block: any,
  //   selectedText: string,
  //   replacementText: string
  // ) => {
  //   // Function removed for single-user application
  // };

  // useEffect(() => {
  //   useAIAssistantStore.getState().setOnApplyAIResult((text: string) => {
  //     const selection = editor.getSelection();
  //     const aiSelectionInfo = useAIAssistantStore.getState().aiSelectionInfo;
  //
  //     if (
  //       selection &&
  //       selection.blocks &&
  //       selection.blocks.length > 0 &&
  //       aiSelectionInfo
  //     ) {
  //       // First, change highlight to processing state
  //       try {
  //         editor.addStyles({
  //           aiHighlight: 'processing',
  //         });
  //       } catch (error) {
  //         console.warn('Could not apply processing style:', error);
  //       }
  //
  //       // Process the replacement after a brief delay
  //       setTimeout(() => {
  //         try {
  //           // Remove the AI highlight from current selection only
  //           if (currentAISelection) {
  //             removeAIHighlightFromSelection(currentAISelection);
  //             setCurrentAISelection(null);
  //           }
  //
  //           const originalSelectedText = editor.getSelectedText();
  //           if (selection.blocks.length === 1 && originalSelectedText) {
  //             const block = selection.blocks[0];
  //             const updatedBlock = replaceSelectedTextInBlock(
  //               block,
  //               originalSelectedText,
  //               text
  //             );
  //
  //             if (updatedBlock) {
  //               const allBlocks = editor.document;
  //               const updatedBlocks = allBlocks.map((b: any) =>
  //                 b.id === block.id ? updatedBlock : b
  //               );
  //               editor.replaceBlocks(allBlocks, updatedBlocks as any);
  //             }
  //           } else {
  //             // Multi-block selection or fallback - use original logic
  //             const newBlocks = markdownToBlocks(text);
  //             const allBlocks = editor.document;
  //             const selectedIds = selection.blocks.map((b) => b.id);
  //
  //             const mappedNewBlocks = newBlocks.map((block, idx) => ({
  //               ...block,
  //               id:
  //                 selectedIds[idx] ||
  //                 'ai-' + Math.random().toString(36).slice(2, 10),
  //             }));
  //
  //             let replaced = 0;
  //             const updatedBlocks = allBlocks.flatMap((block: any) => {
  //               if (selectedIds.includes(block.id)) {
  //                 replaced++;
  //                 return replaced <= mappedNewBlocks.length
  //                   ? [mappedNewBlocks[replaced - 1]]
  //                   : [];
  //               }
  //               return [block];
  //             });
  //
  //             if (mappedNewBlocks.length > selectedIds.length) {
  //               const lastIdx = allBlocks.findIndex(
  //                 (b) => b.id === selectedIds[selectedIds.length - 1]
  //               );
  //               updatedBlocks.splice(
  //                 lastIdx + 1,
  //                 0,
  //                 ...mappedNewBlocks.slice(selectedIds.length)
  //               );
  //             }
  //
  //             editor.replaceBlocks(allBlocks, updatedBlocks as any);
  //           }
  //         } catch (error) {
  //           console.error('Error during AI text replacement:', error);
  //         }
  //       }, 500);
  //     }
  //   });
  //   // Cleanup on unmount
  //   return () => {
  //     useAIAssistantStore.getState().setOnApplyAIResult(undefined);
  //   };
  // }, [editor, currentAISelection, removeAIHighlightFromSelection]); // Removed chat functionality

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-sm text-muted-foreground">Loading editor...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/50">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error</div>
          <div className="text-sm text-muted-foreground">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-muted/50 relative">
      {/* Floating Action Buttons - Hidden in Focus Mode */}
      {!settings.focusMode && (
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/articles/${articleId}`)}
            className={`p-2 backdrop-blur-sm shadow-sm border border-border/50 ${
              settings.theme === 'dark'
                ? 'bg-card/80 hover:bg-card'
                : 'bg-white/80 hover:bg-white'
            }`}
            title="Back to Article"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
          {/* Left Sidebar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLeftSidebar}
            className={`p-2 backdrop-blur-sm shadow-sm border border-border/50 ${
              settings.theme === 'dark'
                ? 'bg-card/80 hover:bg-card'
                : 'bg-white/80 hover:bg-white'
            }`}
            title="Toggle Left Sidebar"
          >
            <PanelLeft className="h-4 w-4 text-foreground" />
          </Button>

          {/* Right Sidebar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              toggleRightSidebar(rightSidebarSection ? null : 'checklist')
            }
            className={`p-2 backdrop-blur-sm shadow-sm border border-border/50 ${
              settings.theme === 'dark'
                ? 'bg-card/80 hover:bg-card'
                : 'bg-white/80 hover:bg-white'
            }`}
            title="Toggle Right Sidebar"
          >
            <PanelRight className="h-4 w-4 text-foreground" />
          </Button>

          {/* Focus Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateSettings({ focusMode: !settings.focusMode })}
            className={`p-2 backdrop-blur-sm shadow-sm border border-border/50 ${
              settings.focusMode
                ? 'bg-primary/20 border-primary/30'
                : settings.theme === 'dark'
                ? 'bg-card/80 hover:bg-card'
                : 'bg-white/80 hover:bg-white'
            }`}
            title="Focus Mode"
          >
            <Focus className="h-4 w-4 text-foreground" />
          </Button>
        </div>
      )}

      {/* Editor Container with Outline */}
      <div
        className={`flex-1 overflow-y-auto custom-scrollbar ${
          settings.focusMode ? 'p-4 bg-background' : 'p-8 bg-muted/50'
        }`}
      >
        <div
          className={
            settings.focusMode ? 'max-w-5xl mx-auto' : 'max-w-4xl mx-auto'
          }
        >
          {/* Editor Outline Container */}
          <div
            className={`${
              settings.focusMode
                ? 'border-0 shadow-none bg-transparent'
                : `border border-border rounded-lg shadow-sm ${
                    settings.theme === 'dark' ? 'bg-card' : 'bg-white'
                  }`
            }`}
          >
            {/* Editor Header - Hidden in Focus Mode */}
            {!settings.focusMode && (
              <div
                className={`sticky top-[-2rem] z-10 border-b border-border px-6 py-4 flex items-center justify-between ${
                  settings.theme === 'dark' ? 'bg-card' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-4">


                  {/* Word Count */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>{wordCount.toLocaleString()} words</span>
                    <span>•</span>
                    <span>{charCount.toLocaleString()} chars</span>
                  </div>

                  {/* Separator */}
                  <div className="h-4 w-px bg-border"></div>

                  {/* Time Logger removed for single-user application */}

                  {/* Separator */}
                  <div className="h-4 w-px bg-border"></div>

                  {/* Save Indicator */}
                  <SaveIndicator status={saveStatus} error={saveError} />
                </div>

                {/* Undo/Redo Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.undo()}
                    className="p-2 h-8 w-8 hover:bg-muted/50"
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.redo()}
                    className="p-2 h-8 w-8 hover:bg-muted/50"
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo className="h-4 w-4" />
                  </Button>

                  {/* Separator */}
                  <div className="h-4 w-px bg-border mx-1"></div>

                  {/* Run Grammar & Spell Check */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      applyGrammarMarkers();
                    }}
                    className="px-3 h-8 hover:bg-muted/50 text-xs flex items-center gap-1"
                    title="Run Grammar & Spell Check"
                    disabled={!isGrammarReady || isGrammarChecking}
                  >
                    <SpellCheck
                      className={`h-4 w-4 ${
                        isGrammarChecking ? 'animate-pulse' : ''
                      }`}
                    />
                  </Button>
                </div>
              </div>
            )}

            {/* Editor Content */}
            <div
              className={`relative ${
                settings.focusMode
                  ? 'p-0 bg-transparent'
                  : `p-0 ${
                      settings.theme === 'dark' ? 'bg-background' : 'bg-white'
                    }`
              }`}
            >
              <div
                ref={editorContainerRef}
                data-editor-container
                className={`min-h-[600px] ${
                  settings.theme === 'dark' ? 'bg-background' : 'bg-white'
                } ${settings.focusMode ? 'focus-mode' : ''}`}
                style={
                  {
                    ...editorStyle,
                    backgroundColor:
                      settings.theme === 'dark'
                        ? 'hsl(var(--background))'
                        : 'white',
                    '--editor-font-family': settings.typography.fontFamily,
                    '--editor-font-size': `${settings.typography.fontSize}px`,
                    '--editor-line-height': settings.typography.lineHeight,
                    '--editor-block-spacing': `${settings.typography.blockSpacing}em`,
                  } as React.CSSProperties
                }
              >
                <div
                  className={`mt-5 ${
                    settings.theme === 'dark' ? 'bg-background' : 'bg-white'
                  }`}
                  data-blocknote-container
                  style={{
                    fontFamily: settings.typography.fontFamily,
                    fontSize: `${settings.typography.fontSize}px`,
                    lineHeight: settings.typography.lineHeight,
                  }}
                >
                  <BlockNoteView
                    editor={editor}
                    theme={settings.theme === 'dark' ? 'dark' : 'light'}
                    id="new-bt-editor"
                    className={`min-h-full ${
                      settings.theme === 'dark' ? 'bg-background' : 'bg-white'
                    }`}
                    style={{
                      backgroundColor:
                        settings.theme === 'dark'
                          ? 'hsl(var(--background))'
                          : 'white',
                      ...editorStyle,
                    }}
                    onChange={saveDocument}
                    editable={!isPreviewMode}
                  >
                    {/* Grammar marker styling is now in a separate CSS file */}

                    <FormattingToolbarController
                      formattingToolbar={() => (
                        <CustomFormattingToolbar />
                      )}
                    />
                  </BlockNoteView>
                </div>

                {/* Floating Comments removed for single-user application */}
                {/* Floating Issue Tooltip */}
                <FloatingIssueTooltip editorRef={editorContainerRef} />
                {/* Floating Grammar Tooltip */}
                <FloatingGrammarTooltip
                  editorRef={editorContainerRef}
                  blockNoteEditor={editor}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
