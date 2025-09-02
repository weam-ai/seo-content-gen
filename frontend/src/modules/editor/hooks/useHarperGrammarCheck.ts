import { useCallback, useRef, useState, useEffect } from 'react';
import {
  harperGrammarChecker,
  HarperGrammarIssue,
} from '@/lib/grammar/harper-grammar-checker';
import { debounce } from 'lodash';

export interface HarperGrammarCheckResult {
  issues: HarperGrammarIssue[];
  stats: {
    wordCount: number;
    characterCount: number;
    sentenceCount: number;
    paragraphCount: number;
    averageWordsPerSentence: number;
    readabilityScore: number;
  };
}

export interface UseHarperGrammarCheckOptions {
  debounceMs?: number;
  enabledChecks?: {
    spelling?: boolean;
    grammar?: boolean;
    style?: boolean;
    punctuation?: boolean;
  };
  autoCheck?: boolean;
}

export const useHarperGrammarCheck = (
  options: UseHarperGrammarCheckOptions = {}
) => {
  const {
    debounceMs = 1500,
    enabledChecks = {
      spelling: true,
      grammar: true,
      style: true,
      punctuation: true,
    },
    autoCheck = true,
  } = options;

  const [isChecking, setIsChecking] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [lastResult, setLastResult] = useState<HarperGrammarCheckResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize Harper.js
  useEffect(() => {
    const initializeHarper = async () => {
      try {
        setIsInitializing(true);
        setError(null);
        await harperGrammarChecker.waitForInitialization();

        if (harperGrammarChecker.hasFailed()) {
          setError(
            'Harper.js failed to initialize - WebAssembly not supported or failed to load'
          );
        }

        setIsInitializing(false);
      } catch (err) {
        console.error('Failed to initialize Harper.js:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to initialize grammar checker'
        );
        setIsInitializing(false);
      }
    };

    initializeHarper();
  }, []);

  // Extract text from BlockNote document with consistent position mapping
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

  // Perform grammar check using Harper.js
  const checkGrammar = useCallback(
    async (text: string): Promise<HarperGrammarCheckResult> => {
      if (!harperGrammarChecker.isReady()) {
        throw new Error('Grammar checker not ready');
      }

      setIsChecking(true);
      setError(null);

      try {
        const allIssues = await harperGrammarChecker.checkText(text);

        // Filter issues based on enabled checks
        const filteredIssues = allIssues.filter((issue) => {
          switch (issue.type) {
            case 'spelling':
              return enabledChecks.spelling;
            case 'grammar':
              return enabledChecks.grammar;
            case 'style':
              return enabledChecks.style;
            case 'punctuation':
              return enabledChecks.punctuation;
            default:
              return true;
          }
        });

        const stats = harperGrammarChecker.getTextStats(text);

        const result: HarperGrammarCheckResult = {
          issues: filteredIssues,
          stats,
        };

        setLastResult(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Grammar check failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsChecking(false);
      }
    },
    [enabledChecks]
  );

  // Debounced grammar check
  const debouncedCheck = useCallback(
    debounce(async (text: string) => {
      if (!autoCheck || text.trim().length === 0) {
        setLastResult(null);
        return;
      }

      // Cancel previous check
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        await checkGrammar(text);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Harper grammar check error:', err);
        }
      }
    }, debounceMs),
    [checkGrammar, debounceMs, autoCheck]
  );

  // Check document from BlockNote editor
  const checkDocument = useCallback(
    (document: any[]) => {
      if (isInitializing || !harperGrammarChecker.isReady()) {
        return;
      }

      const text = extractTextFromDocument(document);
      debouncedCheck(text);
    },
    [extractTextFromDocument, debouncedCheck, isInitializing]
  );

  // Check text directly
  const checkText = useCallback(
    (text: string) => {
      if (isInitializing || !harperGrammarChecker.isReady()) {
        return;
      }

      debouncedCheck(text);
    },
    [debouncedCheck, isInitializing]
  );

  // Manual check (immediate, no debounce)
  const checkNow = useCallback(
    async (document: any[]) => {
      if (isInitializing || !harperGrammarChecker.isReady()) {
        throw new Error('Grammar checker not ready');
      }

      const text = extractTextFromDocument(document);
      if (text.trim().length === 0) {
        setLastResult(null);
        return null;
      }

      return await checkGrammar(text);
    },
    [extractTextFromDocument, checkGrammar, isInitializing]
  );

  // Clear results
  const clearResults = useCallback(() => {
    setLastResult(null);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Get issue count by type
  const getIssueCountByType = useCallback(() => {
    if (!lastResult)
      return { spelling: 0, grammar: 0, style: 0, punctuation: 0, total: 0 };

    const counts = {
      spelling: 0,
      grammar: 0,
      style: 0,
      punctuation: 0,
      total: lastResult.issues.length,
    };

    lastResult.issues.forEach((issue) => {
      counts[issue.type]++;
    });

    return counts;
  }, [lastResult]);

  // Get readability level description
  const getReadabilityLevel = useCallback(() => {
    if (!lastResult) return 'Unknown';

    const score = lastResult.stats.readabilityScore;

    if (score >= 90) return 'Very Easy';
    if (score >= 80) return 'Easy';
    if (score >= 70) return 'Fairly Easy';
    if (score >= 60) return 'Standard';
    if (score >= 50) return 'Fairly Difficult';
    if (score >= 30) return 'Difficult';
    return 'Very Difficult';
  }, [lastResult]);

  return {
    // State
    isChecking,
    isInitializing,
    lastResult,
    error,
    isReady: !isInitializing && harperGrammarChecker.isReady(),

    // Actions
    checkDocument,
    checkText,
    checkNow,
    clearResults,

    // Computed values
    getIssueCountByType,
    getReadabilityLevel,

    // Utils
    extractTextFromDocument,
  };
};
