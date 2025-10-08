import { useCallback, useRef } from 'react';
import useEditor from './useEditor';
import { useHarperGrammarCheck } from './useHarperGrammarCheck';

// Import CSS for grammar markers
import '../styles/grammar-markers.css';

export interface GrammarMarkerData {
  id: string;
  start: number;
  end: number;
  type: 'spelling' | 'grammar' | 'punctuation' | 'style';
  message: string;
  suggestions: string[];
}

export function useGrammarChecking() {
  const { editorRef } = useEditor();
  const grammarIssuesRef = useRef<Map<string, GrammarMarkerData>>(new Map());

  // Initialize Harper grammar checking hook
  const {
    checkNow: checkGrammarNow,
    isChecking: isGrammarChecking,
    isReady: isGrammarReady,
  } = useHarperGrammarCheck({
    enabledChecks: {
      spelling: true,
      grammar: true,
      punctuation: true,
      style: true,
    },
    autoCheck: false, // We'll manually trigger checks
    debounceMs: 2000,
  });

  /**
   * Helper function to find word boundaries around a character position
   */
  const findWordBoundaries = useCallback(
    (text: string, start: number, end: number) => {
      // Word boundary regex - includes letters, numbers, apostrophes, and hyphens
      const wordChar = /[a-zA-Z0-9''-]/;

      let wordStart = start;
      let wordEnd = end;

      // Expand backwards to find word start
      while (wordStart > 0 && wordChar.test(text[wordStart - 1])) {
        wordStart--;
      }

      // Expand forwards to find word end
      while (wordEnd < text.length && wordChar.test(text[wordEnd])) {
        wordEnd++;
      }

      return { wordStart, wordEnd };
    },
    []
  );

  /**
   * Extract text using the exact same logic as useHarperGrammarCheck
   * This ensures position mapping is accurate
   */
  const extractTextFromDocument = useCallback((document: any[]): string => {
    if (!Array.isArray(document)) return '';

    let text = '';

    const extractFromBlock = (block: any): string => {
      let blockText = '';

      if (Array.isArray(block.content)) {
        for (const node of block.content) {
          if (typeof node === 'string') {
            blockText += node;
          } else if (node && typeof node === 'object') {
            if (node.type === 'text' && node.text) {
              blockText += node.text;
            } else if (node.type === 'grammar' && node.props?.originalText) {
              // Use original text for grammar markers to avoid checking suggestions
              blockText += node.props.originalText;
            } else if (node.type === 'issue' && node.props?.originalText) {
              // Use original text for issue markers to avoid checking suggestions
              blockText += node.props.originalText;
            }
          }
        }
      } else if (typeof block.content === 'string') {
        blockText = block.content;
      }

      // Add children text
      if (Array.isArray(block.children)) {
        for (const child of block.children) {
          blockText += ' ' + extractFromBlock(child);
        }
      }

      return blockText;
    };

    for (const block of document) {
      const blockText = extractFromBlock(block);
      if (blockText.trim()) {
        // Only add block separator if we have existing text
        if (text.length > 0) {
          text += '\n\n';
        }
        text += blockText;
      }
    }

    return text;
  }, []);

  /**
   * Build accurate position mapping between plain text and BlockNote structure
   * This must match exactly how extractTextFromDocument works in useHarperGrammarCheck
   */
  const buildPositionMapping = useCallback((blocks: any[]) => {
    const mapping: Array<{
      blockIndex: number;
      nodeIndex: number;
      plainTextStart: number;
      plainTextEnd: number;
      blockTextStart: number;
      blockTextEnd: number;
      originalNode: any;
    }> = [];

    let plainTextPosition = 0;
    let hasAddedAnyText = false;

    blocks.forEach((block, blockIndex) => {
      let blockTextPosition = 0;
      let blockHasText = false;

      if (Array.isArray(block.content)) {
        block.content.forEach((node: any, nodeIndex: number) => {
          if (
            node &&
            typeof node === 'object' &&
            node.type === 'text' &&
            node.text
          ) {
            const nodeText = node.text;
            const textLength = nodeText.length;

            // Only add block separator if we have existing text (matches Harper hook logic)
            if (blockTextPosition === 0 && hasAddedAnyText) {
              plainTextPosition += 2; // for '\n\n' between blocks
            }

            mapping.push({
              blockIndex,
              nodeIndex,
              plainTextStart: plainTextPosition,
              plainTextEnd: plainTextPosition + textLength,
              blockTextStart: blockTextPosition,
              blockTextEnd: blockTextPosition + textLength,
              originalNode: node,
            });

            plainTextPosition += textLength;
            blockTextPosition += textLength;
            blockHasText = true;
          }
        });
      }

      if (blockHasText) {
        hasAddedAnyText = true;
      }
    });

    return mapping;
  }, []);

  /**
   * Helper function to apply grammar markers to blocks with accurate position mapping
   */
  const applyGrammarMarkersToBlocks = useCallback(
    (blocks: any[], issues: any[]) => {
      if (!issues.length) return blocks;

      // Build accurate position mapping
      const positionMapping = buildPositionMapping(blocks);

      // Debug: also extract the text to see what Harper.js is analyzing
      const extractedText = extractTextFromDocument(blocks);

      // Create a copy of blocks to modify
      const updatedBlocks = JSON.parse(JSON.stringify(blocks));

      // Filter out issues that are too long (usually sentence-level suggestions)
      const filteredIssues = issues.filter((issue) => {
        const issueLength = issue.end - issue.start;
        const maxLength = 50; // Skip issues longer than 50 characters

        if (issueLength > maxLength) {
          return false;
        }

        // Also skip issues that span multiple sentences (contain periods)
        if (issue.originalText.includes('.') && issueLength > 20) {
          return false;
        }

        return true;
      });

      // Group issues by block and node for batch processing
      const issuesByNode = new Map<
        string,
        Array<{
          issue: any;
          mapping: any;
          relativeStart: number;
          relativeEnd: number;
        }>
      >();

      // First pass: calculate all positions and group by node
      filteredIssues.forEach((issue, issueIndex) => {

        // Find the text nodes that contain this issue using accurate mapping
        const relevantMappings = positionMapping.filter(
          (mapping) =>
            issue.start < mapping.plainTextEnd &&
            issue.end > mapping.plainTextStart
        );

        if (relevantMappings.length === 0) {
          console.warn('No mapping found for issue:', issue);
          return;
        }

        // Process each relevant mapping (usually just one)
        relevantMappings.forEach((mapping) => {
          const nodeKey = `${mapping.blockIndex}-${mapping.nodeIndex}`;

          const block = updatedBlocks[mapping.blockIndex];
          const node = block.content[mapping.nodeIndex];

          if (!node || node.type !== 'text') return;

          // Calculate relative positions within this node
          let relativeStart = Math.max(0, issue.start - mapping.plainTextStart);
          let relativeEnd = Math.min(
            node.text.length,
            issue.end - mapping.plainTextStart
          );

          if (relativeStart >= relativeEnd || relativeStart < 0) {
            console.warn('Invalid relative positions:', {
              relativeStart,
              relativeEnd,
              nodeLength: node.text.length,
              issue,
              mapping,
            });
            return;
          }

          // Adjust positions to word boundaries for better accuracy
          const nodeText = node.text;
          const { wordStart, wordEnd } = findWordBoundaries(
            nodeText,
            relativeStart,
            relativeEnd
          );

          // Only adjust if the word boundaries make sense and don't extend too far
          const maxExpansion = 15; // Don't expand more than 15 characters
          if (
            wordStart >= Math.max(0, relativeStart - maxExpansion) &&
            wordEnd <= Math.min(nodeText.length, relativeEnd + maxExpansion)
          ) {
            // Check if the expanded selection still contains the original issue
            const expandedText = nodeText.substring(wordStart, wordEnd);
            const originalIssueText = nodeText.substring(
              relativeStart,
              relativeEnd
            );

            // Only use word boundaries if they include the original issue
            if (
              expandedText.includes(originalIssueText) ||
              originalIssueText.includes(expandedText)
            ) {
              relativeStart = wordStart;
              relativeEnd = wordEnd;
            }
          }

          // Verify the text matches what Harper found
          const actualText = node.text.substring(relativeStart, relativeEnd);
          if (
            actualText !== issue.originalText &&
            !actualText.includes(issue.originalText)
          ) {
            console.warn('Text mismatch - skipping issue:', {
              expected: issue.originalText,
              actual: actualText,
              issue,
              mapping,
            });
            return;
          }

          // Add to the group for this node
          if (!issuesByNode.has(nodeKey)) {
            issuesByNode.set(nodeKey, []);
          }

          issuesByNode.get(nodeKey)!.push({
            issue,
            mapping,
            relativeStart,
            relativeEnd,
          });
        });
      });

      // Second pass: apply all issues for each node in reverse order (end to start)
      issuesByNode.forEach((nodeIssues, nodeKey) => {
        const [blockIndex, nodeIndex] = nodeKey.split('-').map(Number);
        const block = updatedBlocks[blockIndex];
        const originalNode = block.content[nodeIndex];

        if (!originalNode || originalNode.type !== 'text') return;

        // Sort issues by position (end to start) to avoid position shifts
        const sortedIssues = nodeIssues.sort(
          (a, b) => b.relativeStart - a.relativeStart
        );

        // Remove overlapping issues (keep the first one encountered)
        const nonOverlappingIssues: Array<{
          issue: any;
          mapping: any;
          relativeStart: number;
          relativeEnd: number;
        }> = [];
        for (const issue of sortedIssues) {
          const overlaps = nonOverlappingIssues.some(
            (existing) =>
              issue.relativeStart < existing.relativeEnd &&
              issue.relativeEnd > existing.relativeStart
          );
          if (!overlaps) {
            nonOverlappingIssues.push(issue);
          }
        }

        // Build the new content by processing issues from end to start
        let currentText = originalNode.text;
        const newContent = [];
        let lastEnd = currentText.length;

        nonOverlappingIssues.forEach(
          ({ issue, relativeStart, relativeEnd }) => {
            const issueId = `grammar-${Date.now()}-${Math.random()}`;
            const grammarMarkerData: GrammarMarkerData = {
              id: issueId,
              start: issue.start,
              end: issue.end,
              type: getIssueType(issue),
              message: issue.message || 'Grammar issue detected',
              suggestions: issue.suggestions || [],
            };

            grammarIssuesRef.current.set(issueId, grammarMarkerData);

            // Add text after this issue (if any)
            if (lastEnd > relativeEnd) {
              newContent.unshift({
                ...originalNode,
                text: currentText.substring(relativeEnd, lastEnd),
              });
            }

            // Add grammar marker
            const issueText = currentText.substring(relativeStart, relativeEnd);
            newContent.unshift({
              type: 'grammar',
              props: {
                originalText: issueText,
                suggestions: (issue.suggestions || []).join(', '),
                message: issue.message,
                type: issue.type,
                severity: issue.severity,
                issueId: issueId,
              },
            });

            lastEnd = relativeStart;
          }
        );

        // Add remaining text at the beginning (if any)
        if (lastEnd > 0) {
          newContent.unshift({
            ...originalNode,
            text: currentText.substring(0, lastEnd),
          });
        }

        // Replace the original node with the new content
        block.content.splice(nodeIndex, 1, ...newContent);
      });

      return updatedBlocks;
    },
    [findWordBoundaries, buildPositionMapping]
  );

  /**
   * Initialize Grammar checking
   */
  const initializeGrammarChecking = useCallback(async () => {
    if (!editorRef?.current || !isGrammarReady) return;

    try {

      // Extract text from editor content with line structure preserved
      const content = editorRef.current.document;

      // Use the hook's check function
      const result = await checkGrammarNow(content);

      if (!result || !result.issues || result.issues.length === 0) {
        return;
      }

      // Apply grammar markers to the content with word and line awareness
      const updatedBlocks = applyGrammarMarkersToBlocks(content, result.issues);

      if (
        updatedBlocks &&
        JSON.stringify(updatedBlocks) !== JSON.stringify(content)
      ) {
        editorRef.current.replaceBlocks(content, updatedBlocks as any);
      }
    } catch (error) {
      console.error('Error during word-aware grammar checking:', error);
    }
  }, [
    editorRef,
    isGrammarReady,
    checkGrammarNow,
    applyGrammarMarkersToBlocks,
    extractTextFromDocument,
  ]);

  /**
   * Function to remove all grammar markers from content
   */
  const removeAllGrammarMarkers = useCallback(() => {
    if (!editorRef?.current) return;

    const content = editorRef.current.document;

    const removeMarkersFromBlocks = (blocks: any[]): any[] => {
      return blocks.map((block) => {
        if (!Array.isArray(block.content)) {
          return block;
        }

        const newContent = block.content.map((node: any) => {
          if (node && typeof node === 'object' && node.type === 'grammar') {
            // Convert grammar marker back to plain text
            return {
              type: 'text',
              text: node.props?.originalText || '',
              styles: {},
            };
          }
          return node;
        });

        const updatedBlock = { ...block, content: newContent };

        if (Array.isArray(block.children)) {
          updatedBlock.children = removeMarkersFromBlocks(block.children);
        }

        return updatedBlock;
      });
    };

    const cleanedBlocks = removeMarkersFromBlocks(content);
    editorRef.current.replaceBlocks(content, cleanedBlocks as any);

    // Clear the grammar issues reference
    grammarIssuesRef.current.clear();
  }, [editorRef]);

  /**
   * Get issue type from Harper issue
   */
  const getIssueType = useCallback((issue: any): GrammarMarkerData['type'] => {
    if (issue.rule && typeof issue.rule === 'string') {
      const rule = issue.rule.toLowerCase();
      if (rule.includes('spell')) return 'spelling';
      if (rule.includes('punctuation')) return 'punctuation';
      if (rule.includes('style')) return 'style';
    }
    return 'grammar';
  }, []);

  /**
   * Get grammar issue data by ID
   */
  const getGrammarIssue = useCallback(
    (issueId: string): GrammarMarkerData | undefined => {
      return grammarIssuesRef.current.get(issueId);
    },
    []
  );

  /**
   * Apply a suggestion to fix a grammar issue
   */
  const applySuggestion = useCallback(
    (issueId: string, suggestion: string) => {
      if (!editorRef?.current) return;

      const issueData = grammarIssuesRef.current.get(issueId);
      if (!issueData) return;

      try {
        const content = editorRef.current.document;

        const findAndReplaceInBlocks = (blocks: any[]): any[] => {
          return blocks.map((block) => {
            if (!Array.isArray(block.content)) {
              return block;
            }

            const newContent = block.content.map((node: any) => {
              if (
                node &&
                typeof node === 'object' &&
                node.type === 'grammar' &&
                node.props?.issueId === issueId
              ) {
                // Replace the grammar marker with the suggestion
                return {
                  type: 'text',
                  text: suggestion,
                  styles: {},
                };
              }
              return node;
            });

            const updatedBlock = { ...block, content: newContent };

            if (Array.isArray(block.children)) {
              updatedBlock.children = findAndReplaceInBlocks(block.children);
            }

            return updatedBlock;
          });
        };

        const updatedBlocks = findAndReplaceInBlocks(content);
        editorRef.current.replaceBlocks(content, updatedBlocks as any);

        // Remove from our tracking
        grammarIssuesRef.current.delete(issueId);
      } catch (error) {
        console.warn('Failed to apply suggestion:', error);
      }
    },
    [editorRef]
  );

  return {
    initializeGrammarChecking,
    applyGrammarMarkersToBlocks,
    removeAllGrammarMarkers,
    getGrammarIssue,
    applySuggestion,
    grammarIssues: grammarIssuesRef.current,
    isChecking: isGrammarChecking,
    isReady: isGrammarReady,
  };
}
