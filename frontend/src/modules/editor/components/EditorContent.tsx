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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Undo,
  Redo,
  History,
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
  getArticleEditorVersions,
  getArticleEditorContentByVersion,
  ArticleEditorVersion,
} from '@/lib/services/topics.service';
import { useParams, useNavigate } from 'react-router-dom';
import { TimeLogger } from './TimeLogger';
import { formatVersionDate } from '@/lib/utils/dateFormat';
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
    setPreviewMode,
  } = useEditor();
  const [articleContent, setArticleContent] = useState<PartialBlock[] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isVersionLoading, setIsVersionLoading] = useState(false);
  const [versions, setVersions] = useState<ArticleEditorVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<PartialBlock[] | null>(
    null
  );

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

  // Load article content and versions
  useEffect(() => {
    (async function () {
      if (!articleId) return;

      try {
        setIsLoading(true);

        // Load versions first
        const versionsData = await getArticleEditorVersions(articleId);
        setVersions(versionsData);

        // Load latest content (no version specified gets latest)
        const content = await getArticleEditorContent(articleId);
        const buffer = new Uint8Array(content.snapshot_data.data);
        const jsonString = new TextDecoder().decode(buffer);
        const parsed = JSON.parse(jsonString);
        setArticleContent(parsed);
        setCurrentVersion(content.version);
      } catch (error: any) {
        console.error('Error fetching editor content:', error);
        setError(error.message || 'Failed to load editor content');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [articleId]);

  // Create editor only after content is loaded
  const editor = useCreateBlockNote(
    {
      schema,
      initialContent: articleContent || undefined,
    },
    [articleContent]
  ); // Add dependency array to recreate editor when content changes

  // Use custom grammar checking hook
  const {
    initializeGrammarChecking,
    isChecking: isGrammarChecking,
    isReady: isGrammarReady,
  } = useGrammarChecking();

  // Grammar checking functionality
  const applyGrammarMarkers = useCallback(async () => {
    if (!editor || !isGrammarReady) {
      console.log('Grammar checking skipped:', {
        hasEditor: !!editor,
        isReady: isGrammarReady,
      });
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

  // Get the most recent 5 versions, sorted by version number (descending)
  const recentVersions = useMemo(() => {
    return versions.sort((a, b) => b.version - a.version).slice(0, 5);
  }, [versions]);

  const handleVersionChange = async (value: string) => {
    if (value === 'view-all') {
      toggleRightSidebar('versions');
      return;
    }

    if (value === 'exit-preview') {
      // Update ref immediately to prevent saves during content restoration
      isPreviewModeRef.current = false;

      // Exit preview mode and restore original content
      if (originalContent) {
        setArticleContent(originalContent);
        setOriginalContent(null);
      }
      setPreviewMode(false);
      // Reset to latest version
      const latestVersion =
        versions.length > 0
          ? Math.max(...versions.map((v) => v.version))
          : null;
      setCurrentVersion(latestVersion);
      return;
    }

    const versionNumber = parseInt(value);
    if (isNaN(versionNumber) || !articleId) return;

    // Check if this is the current version (not preview mode)
    const latestVersion =
      versions.length > 0 ? Math.max(...versions.map((v) => v.version)) : null;
    const isLatestVersion = versionNumber === latestVersion;

    try {
      setIsVersionLoading(true);
      setError(null);

      // Store original content if entering preview mode
      if (!isLatestVersion && !isPreviewMode) {
        setOriginalContent(articleContent);
      }

      // Set preview mode BEFORE changing content to prevent saving
      const versionInfo = versions.find((v) => v.version === versionNumber);
      const willBeInPreviewMode = !isLatestVersion;

      // Update ref immediately for synchronous access
      isPreviewModeRef.current = willBeInPreviewMode;

      setPreviewMode(
        willBeInPreviewMode,
        versionInfo ? `v${versionInfo.version}` : undefined
      );

      const content = await getArticleEditorContentByVersion(
        articleId,
        versionNumber
      );
      const buffer = new Uint8Array(content.snapshot_data.data);
      const jsonString = new TextDecoder().decode(buffer);
      const parsed = JSON.parse(jsonString);

      setArticleContent(parsed);
      setCurrentVersion(versionNumber);
    } catch (error: any) {
      console.error('Error fetching version content:', error);
      setError(error.message || 'Failed to load version content');
    } finally {
      setIsVersionLoading(false);
    }
  };

  const debouncedSave = useMemo(() => {
    return debounce(async () => {
      // Don't save if there's an active text selection, in preview mode, or loading a version
      if (
        editor &&
        !editor.getSelectedText() &&
        !isPreviewMode &&
        !isVersionLoading
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
      } else if (isPreviewMode) {
        console.log('Skipping save - preview mode is active');
      } else if (isVersionLoading) {
        console.log('Skipping save - version is loading');
      }
    }, 1000);
  }, [editor, sessionId, setSaveStatus, isPreviewMode, isVersionLoading]);

  const saveDocument = useCallback(() => {
    setTimeout(() => {
      if (!isPreviewModeRef.current) debouncedSave();
    }, 0);
  }, [debouncedSave]);

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
  if (isLoading || !editor) {
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
              toggleRightSidebar(rightSidebarSection ? null : null)
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
                  {/* Version Selection */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Version:
                    </span>
                    <Select
                      value={currentVersion?.toString() || ''}
                      onValueChange={handleVersionChange}
                      disabled={isVersionLoading}
                    >
                      <SelectTrigger
                        className={`w-48 h-8 text-sm ${
                          isPreviewMode
                            ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                            : 'bg-background border-border'
                        }`}
                      >
                        <SelectValue placeholder="Select version">
                          {currentVersion && versions.length > 0 && (
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <span className="text-foreground">
                                  v{currentVersion}
                                </span>
                                {isPreviewMode && (
                                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded">
                                    Preview
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground ml-2">
                                {formatVersionDate(
                                  versions.find(
                                    (v) => v.version === currentVersion
                                  )?.updated_at ||
                                    versions.find(
                                      (v) => v.version === currentVersion
                                    )?.created_at ||
                                    new Date().toISOString()
                                )}
                              </span>
                            </div>
                          )}
                        </SelectValue>
                        {isVersionLoading && (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-primary" />
                        )}
                      </SelectTrigger>
                      <SelectContent className="w-48 bg-background border-border">
                        {recentVersions.map((version) => (
                          <SelectItem
                            key={version.version}
                            value={version.version.toString()}
                            className="py-2 text-foreground"
                          >
                            <div className="flex flex-col w-full max-h-12">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-foreground">
                                  v{version.version}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatVersionDate(
                                    version.updated_at || version.created_at
                                  )}
                                </span>
                              </div>
                              {version.updated_by && (
                                <div className="text-xs text-muted-foreground truncate mt-0.5">
                                  by {version.updated_by.firstname}{' '}
                                  {version.updated_by.lastname}
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                        {versions.length > 5 && (
                          <div className="px-2 py-1 text-xs text-muted-foreground border-t">
                            +{versions.length - 5} more versions
                          </div>
                        )}
                        {versions.length > 0 && (
                          <>
                            <div className="border-t my-1" />
                            {isPreviewMode && (
                              <SelectItem value="exit-preview">
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                  <ArrowLeft className="h-3 w-3" />
                                  Exit Preview
                                </div>
                              </SelectItem>
                            )}
                            <SelectItem value="view-all">
                              <div className="flex items-center gap-2">
                                <History className="h-3 w-3" />
                                View All
                                {versions.length > 5 && (
                                  <span className="text-xs text-muted-foreground">
                                    ({versions.length})
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Separator */}
                  <div className="h-4 w-px bg-border"></div>

                  {/* Word Count */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>{wordCount.toLocaleString()} words</span>
                    <span>•</span>
                    <span>{charCount.toLocaleString()} chars</span>
                  </div>

                  {/* Separator */}
                  <div className="h-4 w-px bg-border"></div>

                  {/* Time Logger */}
                  <TimeLogger />

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
                      console.log('Grammar & spell check triggered');
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
