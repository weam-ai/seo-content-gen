import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';

interface RecommendedKeyword {
  keyword: string;
  title?: string;
}

interface SecondaryKeywordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKeywords: string[];
  recommendedKeywords: RecommendedKeyword[];
  loading?: boolean;
  onApprove: (keywords: string[]) => void;
  initialNewKeywords?: string[];
  topicTitle?: string;
  primaryKeyword?: string;
}

export default function SecondaryKeywordModal({
  open,
  onOpenChange,
  initialKeywords,
  recommendedKeywords,
  loading = false,
  onApprove,
  initialNewKeywords = [],
  topicTitle,
  primaryKeyword,
}: SecondaryKeywordModalProps) {
  const [modalExistingKeywords, setModalExistingKeywords] = useState<string[]>(
    []
  );
  const [modalKeywords, setModalKeywords] = useState<string[]>([]);
  const [modalInput, setModalInput] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setModalExistingKeywords([...initialKeywords]);
      setModalKeywords([...initialNewKeywords]);
      setModalInput('');
      setModalLoading(false);
    }
    // Only depend on 'open' to avoid resetting state unnecessarily
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleApprove = async () => {
    setModalLoading(true);
    try {
      const updatedKeywords = [...modalExistingKeywords, ...modalKeywords];
      await onApprove(updatedKeywords);
      onOpenChange(false);
      setModalKeywords([]);
      setModalInput('');
      setModalExistingKeywords([]);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>Verify Topic Details</DialogTitle>
        <div className="mt-2 text-sm text-muted-foreground">
          Please review and verify the topic details below before approving.
        </div>

        {/* Topic Title and Primary Keyword - Disabled Inputs */}
        <div className="mt-4 space-y-3">
          {topicTitle && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Topic Title
              </label>
              <p className="w-full border rounded px-3 py-2 bg-muted text-muted-foreground cursor-not-allowed">
                {topicTitle}
              </p>
            </div>
          )}
          {primaryKeyword && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Primary Keyword
              </label>
              <div>
                <Badge
                  key={primaryKeyword}
                  variant="secondary"
                  className="text-xs flex items-center gap-1 max-w-fit"
                >
                  {primaryKeyword}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Secondary Keywords Section */}
        <div className="mt-4">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Secondary Keywords (Optional)
          </label>

          {/* Chips for already added and new modal keywords */}
          <div className="flex flex-wrap gap-1 mb-2">
            {/* Existing secondary keywords (removable in modal) */}
            {modalExistingKeywords.map((kw: string) => (
              <Badge
                key={kw}
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                {kw}
                <button
                  type="button"
                  className="ml-1 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    setModalExistingKeywords(
                      modalExistingKeywords.filter((k) => k !== kw)
                    )
                  }
                  disabled={modalLoading}
                  title="Remove keyword"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {/* New modal keywords (removable) */}
            {modalKeywords.map((kw) => (
              <Badge
                key={kw}
                variant="outline"
                className="text-xs flex items-center gap-1"
              >
                {kw}
                <button
                  type="button"
                  className="ml-1 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    setModalKeywords(modalKeywords.filter((k) => k !== kw))
                  }
                  disabled={modalLoading}
                  title="Remove keyword"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Tag input for modal */}
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder={(() => {
              if (modalInput) return 'Enter secondary keyword (optional)';
              const firstWithTitle = recommendedKeywords.find((k) => k.title);
              if (firstWithTitle) return `Suggestion: ${firstWithTitle.title}`;
              return 'Enter secondary keyword (optional)';
            })()}
            value={modalInput}
            onChange={(e) => setModalInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ',') && modalInput.trim()) {
                e.preventDefault();
                if (
                  !modalKeywords.includes(modalInput.trim()) &&
                  !modalExistingKeywords.includes(modalInput.trim())
                ) {
                  setModalKeywords([...modalKeywords, modalInput.trim()]);
                }
                setModalInput('');
              }
            }}
            disabled={modalLoading}
            maxLength={100}
          />
          <div className="text-xs text-muted-foreground mt-1">
            Press Enter or comma to add keyword
          </div>
        </div>

        {/* Recommended Keywords - moved below secondary keyword input */}
        {recommendedKeywords.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Recommended Keywords
            </div>
            <div className="flex flex-wrap gap-1">
              {recommendedKeywords.map((k) => (
                <button
                  key={k.keyword}
                  type="button"
                  className="px-2 py-1 rounded bg-muted text-xs border hover:bg-primary/10 transition"
                  onClick={() => {
                    if (
                      !modalKeywords.includes(k.keyword) &&
                      !modalExistingKeywords.includes(k.keyword)
                    )
                      setModalKeywords([...modalKeywords, k.keyword]);
                  }}
                  disabled={
                    modalLoading ||
                    modalKeywords.includes(k.keyword) ||
                    modalExistingKeywords.includes(k.keyword)
                  }
                >
                  {k.keyword}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Show the title as a suggestion below the input if available */}
        {(function () {
          const selected = recommendedKeywords.find(
            (k) => k.keyword === modalInput
          );
          if (selected && selected.title) {
            return (
              <div className="text-xs text-muted-foreground mt-1">
                Suggestion: {selected.title}
              </div>
            );
          }
          return null;
        })()}
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={modalLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={modalLoading}
            className="razor-gradient flex items-center"
          >
            {modalLoading || loading ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : null}
            Verify and Approve
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
