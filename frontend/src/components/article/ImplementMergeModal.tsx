import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import BlockRenderer, { getWordDiff } from '../ui/BlockRenderer';
import { ArrowLeft, Check, Plus } from 'lucide-react';

interface ImplementMergeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBlocks: any[];
  generatedBlocks: any[];
  onApply: (mergedBlocks: any[]) => void;
}

// Helper to flatten block content to plain text
function blockToText(block: any): string {
  if (!block) return '';
  if (block.props && Array.isArray(block.props.content)) {
    return block.props.content.map((n: any) => n.text || '').join(' ');
  }
  if (block.content && Array.isArray(block.content)) {
    return block.content.map((n: any) => n.text || '').join(' ');
  }
  if (typeof block.props?.content === 'string') return block.props.content;
  if (typeof block.content === 'string') return block.content;
  return '';
}

// Inline diff renderer for word-level highlighting
function InlineWordDiff({ oldText, newText, mode }: { oldText: string; newText: string; mode: 'current' | 'generated' }) {
  const diff = getWordDiff(oldText, newText);
  return (
    <span>
      {diff.map((part, idx) => {
        if (mode === 'current') {
          if (part.removed) return <span key={idx} className="bg-red-100 text-red-800 line-through">{part.value}</span>;
          if (!part.added && !part.removed) return <span key={idx}>{part.value}</span>;
          // skip additions
          return null;
        } else {
          if (part.added) return <span key={idx} className="bg-green-100 text-green-800">{part.value}</span>;
          if (!part.added && !part.removed) return <span key={idx}>{part.value}</span>;
          // skip removals
          return null;
        }
      })}
    </span>
  );
}

const ImplementMergeModal: React.FC<ImplementMergeModalProps> = ({
  open,
  onOpenChange,
  currentBlocks,
  generatedBlocks,
  onApply,
}) => {
  const maxLen = Math.max(currentBlocks.length, generatedBlocks.length);
  const [choices, setChoices] = useState<('current' | 'generated')[]>(
    Array(maxLen).fill('generated')
  );

  React.useEffect(() => {
    setChoices(Array(maxLen).fill('generated'));
  }, [currentBlocks.length, generatedBlocks.length]);

  const handleChoice = (idx: number, which: 'current' | 'generated') => {
    setChoices((prev) => {
      const next = [...prev];
      next[idx] = which;
      return next;
    });
  };

  const handleApply = () => {
    const merged = Array(maxLen)
      .fill(null)
      .map((_, idx) =>
        choices[idx] === 'generated' ? generatedBlocks[idx] : currentBlocks[idx]
      )
      .filter(Boolean);
    onApply(merged);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Merge Implemented Content
          </DialogTitle>
          <DialogDescription>
            Review each block. Accept (→) to use the generated block, or Revert (←) to keep your original. Apply changes when done.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {/* Render rows for each block pair */}
          {Array(maxLen).fill(null).map((_, idx) => (
            <div
              key={idx}
              className="flex gap-4 w-full items-stretch"
            >
              {/* Current Block */}
              <div
                className="flex-1 relative border rounded p-2 mb-2 bg-gray-50 break-words max-w-full whitespace-pre-line"
                style={{ minWidth: 0 }}
              >
                {currentBlocks[idx] !== undefined &&
                  currentBlocks[idx] !== null &&
                  currentBlocks[idx] !== '' &&
                  currentBlocks[idx] !== 'null' &&
                  currentBlocks[idx] !== '[]' && (
                    (() => {
                      const block = currentBlocks[idx];
                      const genBlock = generatedBlocks[idx];
                      if (block && genBlock && (block.type === 'paragraph' || block.type === 'heading') && (genBlock.type === 'paragraph' || genBlock.type === 'heading')) {
                        return <InlineWordDiff oldText={blockToText(block)} newText={blockToText(genBlock)} mode="current" />;
                      }
                      return <BlockRenderer content={JSON.stringify([block])} />;
                    })()
                  )}
              </div>
              {/* Center column with buttons */}
              <div className="flex flex-col justify-center items-center gap-2 px-1 min-w-[40px]">
                <Button
                  size="icon"
                  variant={choices[idx] === 'current' ? 'default' : 'outline'}
                  className="p-1 h-7 w-7"
                  onClick={() => handleChoice(idx, 'current')}
                  title="Keep Current Block"
                >
                  <ArrowLeft size={16} />
                </Button>
                <Button
                  size="icon"
                  variant={choices[idx] === 'generated' ? 'default' : 'outline'}
                  className="p-1 h-7 w-7"
                  onClick={() => handleChoice(idx, 'generated')}
                  title="Accept Generated Block"
                >
                  <Plus size={16} />
                </Button>
              </div>
              {/* Generated Block */}
              <div
                className="flex-1 relative border rounded p-2 mb-2 bg-gray-50 break-words max-w-full whitespace-pre-line"
                style={{ minWidth: 0 }}
              >
                {generatedBlocks[idx] !== undefined &&
                  generatedBlocks[idx] !== null &&
                  generatedBlocks[idx] !== '' &&
                  generatedBlocks[idx] !== 'null' &&
                  generatedBlocks[idx] !== '[]' && (
                    (() => {
                      const block = generatedBlocks[idx];
                      const curBlock = currentBlocks[idx];
                      if (block && curBlock && (block.type === 'paragraph' || block.type === 'heading') && (curBlock.type === 'paragraph' || curBlock.type === 'heading')) {
                        return <InlineWordDiff oldText={blockToText(curBlock)} newText={blockToText(block)} mode="generated" />;
                      }
                      return <BlockRenderer content={JSON.stringify([block])} />;
                    })()
                  )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="" onClick={handleApply}>
            <Check className="h-4 w-4 mr-2" /> Apply Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImplementMergeModal; 