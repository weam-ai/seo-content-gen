import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertCircle, Lightbulb, Zap, Type } from 'lucide-react';
import { HarperGrammarIssue } from '@/lib/grammar/harper-grammar-checker';

interface FloatingGrammarTooltipProps {
  editorRef: React.RefObject<HTMLDivElement>;
  blockNoteEditor?: any; // BlockNote editor instance
}

export const FloatingGrammarTooltip: React.FC<FloatingGrammarTooltipProps> = ({
  editorRef,
  blockNoteEditor,
}) => {
  const [activeIssue, setActiveIssue] = useState<{
    issue: HarperGrammarIssue;
    element: HTMLElement;
    rect: DOMRect;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);

  // Clear any pending timeouts
  const clearHoverTimeout = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  // Handle grammar marker hover with improved logic
  useEffect(() => {
    const handleMouseEnter = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const grammarElement = target.closest('[data-grammar-issue-id]');

      if (grammarElement) {
        // Clear any pending hide timeout
        clearHoverTimeout();
        isHoveringRef.current = true;

        const issueId = grammarElement.getAttribute('data-grammar-issue-id');
        const type = grammarElement.getAttribute(
          'data-grammar-type'
        ) as HarperGrammarIssue['type'];
        const severity = grammarElement.getAttribute(
          'data-grammar-severity'
        ) as HarperGrammarIssue['severity'];

        if (issueId && type && severity) {
          const rect = grammarElement.getBoundingClientRect();
          const originalText = grammarElement.textContent || '';
          const title = grammarElement.getAttribute('title') || '';

          // Parse title to extract message and suggestions
          const parts = title.split(' | ');
          const message = parts[0]?.replace(`${type}: `, '') || '';
          const suggestionsText = parts[1]?.replace('Suggestions: ', '') || '';
          const suggestions = suggestionsText
            ? suggestionsText.split(', ').filter((s) => s.trim())
            : [];

          const issue: HarperGrammarIssue = {
            id: issueId,
            start: 0,
            end: originalText.length,
            originalText,
            suggestions,
            message,
            type,
            severity,
          };

          setActiveIssue({
            issue,
            element: grammarElement as HTMLElement,
            rect,
          });
        }
      }
    };

    const handleMouseLeave = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const grammarElement = target.closest('[data-grammar-issue-id]');

      if (grammarElement) {
        isHoveringRef.current = false;

        // Clear any existing timeout
        clearHoverTimeout();

        // Set a timeout to hide the tooltip if user doesn't hover over it
        hoverTimeoutRef.current = setTimeout(() => {
          // Only hide if we're not hovering over the tooltip or another grammar element
          if (!isHoveringRef.current) {
            setActiveIssue(null);
          }
        }, 300); // Increased delay for easier tooltip access
      }
    };

    const editorElement = editorRef.current;
    if (editorElement) {
      editorElement.addEventListener('mouseenter', handleMouseEnter, true);
      editorElement.addEventListener('mouseleave', handleMouseLeave, true);
    }

    return () => {
      clearHoverTimeout();
      if (editorElement) {
        editorElement.removeEventListener('mouseenter', handleMouseEnter, true);
        editorElement.removeEventListener('mouseleave', handleMouseLeave, true);
      }
    };
  }, [editorRef]);

  // Update tooltip position with improved gap for hover stability
  useEffect(() => {
    if (activeIssue) {
      const { rect } = activeIssue;
      const tooltipElement = tooltipRef.current;

      if (tooltipElement) {
        const tooltipRect = tooltipElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let x = rect.left + rect.width / 2 - tooltipRect.width / 2;
        let y = rect.bottom + 8; // Smaller gap to make hover transition easier

        // Adjust horizontal position if tooltip goes off screen
        if (x < 8) {
          x = 8;
        } else if (x + tooltipRect.width > viewportWidth - 8) {
          x = viewportWidth - tooltipRect.width - 8;
        }

        // Adjust vertical position if tooltip goes off screen
        if (y + tooltipRect.height > viewportHeight - 8) {
          y = rect.top - tooltipRect.height - 8; // Smaller gap
        }

        setTooltipPosition({ x, y });
      }
    }
  }, [activeIssue]);

  // Cleanup effect to clear timeouts on unmount
  useEffect(() => {
    return () => {
      clearHoverTimeout();
    };
  }, []);

  // Apply suggestion
  const applySuggestion = (suggestion: string) => {
    if (!activeIssue || !blockNoteEditor) return;

    const { element, issue } = activeIssue;
    const issueId = issue.id;

    try {
      // Get all blocks from the editor
      const allBlocks = blockNoteEditor.document;
      let hasChanges = false;

      // Find and update the block containing the grammar marker
      const updatedBlocks = allBlocks.map((block: any) => {
        if (block.content && Array.isArray(block.content)) {
          const updatedContent = block.content.map((node: any) => {
            // Check if this is the grammar marker we want to replace
            if (node.type === 'grammar' && node.props?.issueId === issueId) {
              hasChanges = true;
              // Replace the grammar marker with plain text
              return {
                type: 'text',
                text: suggestion,
                styles: {},
              };
            }
            return node;
          });

          if (hasChanges) {
            return { ...block, content: updatedContent };
          }
        }
        return block;
      });

      // Update the editor content if changes were made
      if (hasChanges) {
        blockNoteEditor.replaceBlocks(allBlocks, updatedBlocks);
      } else {
        // Fallback: try to update the DOM element directly
        if (element.textContent) {
          element.textContent = suggestion;
          element.removeAttribute('data-grammar-issue-id');
          element.removeAttribute('data-grammar-type');
          element.removeAttribute('data-grammar-severity');
          element.removeAttribute('title');
          element.style.backgroundColor = '';
          element.style.borderBottom = '';
        }
      }
    } catch (error) {
      console.error('Error applying grammar suggestion:', error);

      // Fallback to DOM manipulation
      if (element.textContent) {
        element.textContent = suggestion;
        element.removeAttribute('data-grammar-issue-id');
        element.removeAttribute('data-grammar-type');
        element.removeAttribute('data-grammar-severity');
        element.removeAttribute('title');
        element.style.backgroundColor = '';
        element.style.borderBottom = '';
      }
    }

    setActiveIssue(null);
  };

  // Dismiss issue
  const dismissIssue = () => {
    if (!activeIssue || !blockNoteEditor) return;

    const { element, issue } = activeIssue;
    const issueId = issue.id;

    try {
      // Get all blocks from the editor
      const allBlocks = blockNoteEditor.document;
      let hasChanges = false;

      // Find and update the block containing the grammar marker
      const updatedBlocks = allBlocks.map((block: any) => {
        if (block.content && Array.isArray(block.content)) {
          const updatedContent = block.content.map((node: any) => {
            // Check if this is the grammar marker we want to dismiss
            if (node.type === 'grammar' && node.props?.issueId === issueId) {
              hasChanges = true;
              // Replace the grammar marker with plain text (original text)
              return {
                type: 'text',
                text: issue.originalText,
                styles: {},
              };
            }
            return node;
          });

          if (hasChanges) {
            return { ...block, content: updatedContent };
          }
        }
        return block;
      });

      // Update the editor content if changes were made
      if (hasChanges) {
        blockNoteEditor.replaceBlocks(allBlocks, updatedBlocks);
      } else {
        // Fallback: try to update the DOM element directly
        element.removeAttribute('data-grammar-issue-id');
        element.removeAttribute('data-grammar-type');
        element.removeAttribute('data-grammar-severity');
        element.removeAttribute('title');
        element.style.backgroundColor = '';
        element.style.borderBottom = '';
      }
    } catch (error) {
      console.error('Error dismissing grammar issue:', error);

      // Fallback to DOM manipulation
      element.removeAttribute('data-grammar-issue-id');
      element.removeAttribute('data-grammar-type');
      element.removeAttribute('data-grammar-severity');
      element.removeAttribute('title');
      element.style.backgroundColor = '';
      element.style.borderBottom = '';
    }

    setActiveIssue(null);
  };

  // Get icon for issue type
  const getIssueIcon = (type: HarperGrammarIssue['type']) => {
    switch (type) {
      case 'spelling':
        return <Type className="h-4 w-4" />;
      case 'grammar':
        return <AlertCircle className="h-4 w-4" />;
      case 'punctuation':
        return <Zap className="h-4 w-4" />;
      case 'style':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Get color for issue type
  const getIssueColor = (
    type: HarperGrammarIssue['type'],
    severity: HarperGrammarIssue['severity']
  ) => {
    switch (type) {
      case 'spelling':
        return severity === 'error' ? 'destructive' : 'secondary';
      case 'grammar':
        return 'default';
      case 'punctuation':
        return 'secondary';
      case 'style':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (!activeIssue) return null;

  const { issue } = activeIssue;

  return (
    <>
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 max-w-sm"
        data-grammar-tooltip="true"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
        }}
        onMouseEnter={() => {
          // User entered tooltip area - clear any pending hide timeout
          clearHoverTimeout();
          isHoveringRef.current = true;
        }}
        onMouseLeave={() => {
          // User left tooltip area - start hide timeout
          isHoveringRef.current = false;
          clearHoverTimeout();
          hoverTimeoutRef.current = setTimeout(() => {
            setActiveIssue(null);
          }, 200);
        }}
      >
        <Card className="shadow-lg border-border bg-background">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                {getIssueIcon(issue.type)}
                <Badge
                  variant={getIssueColor(issue.type, issue.severity) as any}
                >
                  {issue.type}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {issue.severity}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissIssue}
                className="h-6 w-6 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Message */}
            <p className="text-sm text-foreground mb-3 leading-relaxed">
              {issue.message}
            </p>

            {/* Original text */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1">Original:</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {issue.originalText}
              </code>
            </div>

            {/* Suggestions */}
            {issue.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Suggestions:</p>
                <div className="space-y-1">
                  {issue.suggestions.slice(0, 3).map((suggestion, index) => (
                    <Button
                      key={`suggestion-${suggestion}-${index}`}
                      variant="outline"
                      size="sm"
                      onClick={() => applySuggestion(suggestion)}
                      className="w-full justify-start text-left h-auto py-2 px-3"
                    >
                      <Check className="h-3 w-3 mr-2 flex-shrink-0" />
                      <span className="text-sm">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissIssue}
                className="text-xs"
              >
                Ignore
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
