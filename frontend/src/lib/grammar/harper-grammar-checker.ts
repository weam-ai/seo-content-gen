/**
 * Harper.js Grammar Checker
 * Advanced grammar and spell checking using Harper.js library via CDN
 */

export interface HarperGrammarIssue {
  id: string;
  start: number;
  end: number;
  originalText: string;
  suggestions: string[];
  message: string;
  type: 'spelling' | 'grammar' | 'punctuation' | 'style';
  severity: 'error' | 'warning' | 'suggestion';
}

export class HarperGrammarChecker {
  private linter: any = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private initializationFailed = false;

  constructor() {
    this.initPromise = this.initialize();
  }

  /**
   * Initialize Harper.js linter using CDN import
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized || this.initializationFailed) return;

    try {

      // Ensure WebAssembly is supported
      if (typeof WebAssembly === 'undefined') {
        throw new Error('WebAssembly is not supported in this environment');
      }

      // Load Harper.js from CDN using dynamic import with proper URL handling
      const harperModule = await this.loadHarperFromCDN();
      const { WorkerLinter, binaryInlined } = harperModule;

      // Create WorkerLinter (non-blocking) with inlined binary
      this.linter = new WorkerLinter({
        binary: binaryInlined,
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Harper.js:', error);
      this.initializationFailed = true;

      // Re-throw the error so the hook can handle it
      throw new Error(
        `Harper.js initialization failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Load Harper.js from CDN using dynamic import
   */
  private async loadHarperFromCDN(): Promise<any> {
    // Use Function constructor to create dynamic import to avoid TypeScript module resolution
    const importFunction = new Function('url', 'return import(url)');
    return await importFunction(
      'https://unpkg.com/harper.js@0.54.0/dist/harper.js'
    );
  }

  /**
   * Ensure the linter is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
    if (!this.isInitialized || !this.linter) {
      throw new Error('Harper.js grammar checker not initialized');
    }
  }

  /**
   * Check text for grammar, spelling, and style issues using Harper.js
   */
  async checkText(text: string): Promise<HarperGrammarIssue[]> {
    await this.ensureInitialized();

    if (!this.linter || !text.trim()) {
      return [];
    }

    try {
      const lints = await this.linter.lint(text);
      const issues: HarperGrammarIssue[] = [];


      for (const lint of lints) {
        const span = lint.span();
        const originalText = text.slice(span.start, span.end);
        const suggestions: string[] = [];

        // Extract suggestions
        for (let i = 0; i < lint.suggestion_count(); i++) {
          const suggestion = lint.suggestions()[i];
          if (suggestion) {
            const replacementText = suggestion.get_replacement_text();
            if (replacementText && replacementText !== originalText) {
              suggestions.push(replacementText);
            }
          }
        }

        // Determine issue type and severity based on Harper's lint type
        const { type, severity } = this.categorizeIssue(lint);

        const issue = {
          id: `harper-${span.start}-${span.end}-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          start: span.start,
          end: span.end,
          originalText,
          suggestions,
          message: lint.message(),
          type,
          severity,
        };

        issues.push(issue);
      }

      return issues.sort((a, b) => a.start - b.start);
    } catch (error) {
      console.error('Harper.js linting error:', error);
      throw error; // Re-throw so the hook can handle it
    }
  }

  /**
   * Categorize Harper lint into our issue types
   */
  private categorizeIssue(lint: any): {
    type: HarperGrammarIssue['type'];
    severity: HarperGrammarIssue['severity'];
  } {
    const message = lint.message().toLowerCase();

    // Spelling errors
    if (
      message.includes('misspelled') ||
      message.includes('spelling') ||
      message.includes('unknown word') ||
      message.includes('not found')
    ) {
      return { type: 'spelling', severity: 'error' };
    }

    // Punctuation issues
    if (
      message.includes('punctuation') ||
      message.includes('comma') ||
      message.includes('period') ||
      message.includes('apostrophe') ||
      message.includes('quotation') ||
      message.includes('semicolon') ||
      message.includes('colon')
    ) {
      return { type: 'punctuation', severity: 'error' };
    }

    // Style suggestions
    if (
      message.includes('consider') ||
      message.includes('prefer') ||
      message.includes('style') ||
      message.includes('redundant') ||
      message.includes('wordy') ||
      message.includes('passive') ||
      message.includes('unclear') ||
      message.includes('awkward')
    ) {
      return { type: 'style', severity: 'suggestion' };
    }

    // Grammar issues (default)
    return { type: 'grammar', severity: 'warning' };
  }

  /**
   * Get text statistics
   */
  getTextStats(text: string): {
    wordCount: number;
    characterCount: number;
    sentenceCount: number;
    paragraphCount: number;
    averageWordsPerSentence: number;
    readabilityScore: number;
  } {
    const words = text.match(/\b\w+\b/g) || [];
    const sentences = text.match(/[.!?]+/g) || [];
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    const wordCount = words.length;
    const characterCount = text.length;
    const sentenceCount = sentences.length;
    const paragraphCount = paragraphs.length;
    const averageWordsPerSentence =
      sentenceCount > 0 ? wordCount / sentenceCount : 0;

    // Simple readability score (Flesch Reading Ease approximation)
    const averageSentenceLength = averageWordsPerSentence;
    const averageSyllablesPerWord = this.estimateAverageSyllables(words);
    const readabilityScore = Math.max(
      0,
      Math.min(
        100,
        206.835 - 1.015 * averageSentenceLength - 84.6 * averageSyllablesPerWord
      )
    );

    return {
      wordCount,
      characterCount,
      sentenceCount,
      paragraphCount,
      averageWordsPerSentence: Math.round(averageWordsPerSentence * 10) / 10,
      readabilityScore: Math.round(readabilityScore),
    };
  }

  /**
   * Estimate average syllables per word (simple heuristic)
   */
  private estimateAverageSyllables(words: string[]): number {
    if (words.length === 0) return 0;

    const totalSyllables = words.reduce((sum, word) => {
      return sum + this.countSyllables(word);
    }, 0);

    return totalSyllables / words.length;
  }

  /**
   * Count syllables in a word (simple heuristic)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    const vowels = word.match(/[aeiouy]+/g);
    let syllableCount = vowels ? vowels.length : 1;

    // Adjust for silent e
    if (word.endsWith('e')) syllableCount--;

    // Ensure at least 1 syllable
    return Math.max(1, syllableCount);
  }

  /**
   * Check if the grammar checker is ready
   */
  isReady(): boolean {
    return (
      this.isInitialized && this.linter !== null && !this.initializationFailed
    );
  }

  /**
   * Check if initialization failed
   */
  hasFailed(): boolean {
    return this.initializationFailed;
  }

  /**
   * Get initialization status
   */
  async waitForInitialization(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }
}

// Export singleton instance
export const harperGrammarChecker = new HarperGrammarChecker();
