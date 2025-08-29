import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { regenerateTopicTitle } from '@/lib/services/topics.service';
import { marked } from 'marked';
import DomPurity from 'dompurify';

interface RegenerateTitleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string;
  currentTitle: string;
  onSaveAndGenerateOutline: (newTitle: string) => Promise<void>;
  outline?: string;
  onFinalSave?: () => void;
}

const RegenerateTitleModal: React.FC<RegenerateTitleModalProps> = ({
  open,
  onOpenChange,
  topicId,
  currentTitle,
  onSaveAndGenerateOutline,
  outline,
  onFinalSave,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<string>('');
  const [regenerating, setRegenerating] = useState(false);
  const [outlineLoading, setOutlineLoading] = useState(false);

  // Fetch a new title when modal opens
  React.useEffect(() => {
    if (open) {
      setNewTitle('');
      setError(null);
      setLoading(true);
      regenerateTopicTitle(topicId)
        .then((title) => setNewTitle(title))
        .catch((err: any) => {
          setError(err.message || 'Failed to generate new title');
          toast({
            title: 'Error',
            description: err.message || 'Failed to generate new title',
            variant: 'destructive',
          });
        })
        .finally(() => setLoading(false));
      setOutlineLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, topicId]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const title = await regenerateTopicTitle(topicId);
      setNewTitle(title);
    } catch (err: any) {
      setError(err.message || 'Failed to generate new title');
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate new title',
        variant: 'destructive',
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveAndGenerateOutline = async () => {
    if (!newTitle.trim()) return;
    setLoading(true);
    setError(null);
    setOutlineLoading(true);
    try {
      await onSaveAndGenerateOutline(newTitle);
      // Do not close modal yet; wait for user to click Save after outline is shown
      setOutlineLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save and generate outline');
      toast({
        title: 'Error',
        description: err.message || 'Failed to save and generate outline',
        variant: 'destructive',
      });
      setOutlineLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSave = async () => {
    if (onFinalSave) {
      setLoading(true);
      try {
        await onFinalSave();
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Regenerate Article Title</DialogTitle>
          <DialogDescription>
            Generate a new topic title. You can accept or regenerate again.
          </DialogDescription>
        </DialogHeader>
        <div className="mb-4">
          <div className="text-xs text-muted-foreground mb-1">
            Current Title
          </div>
          <div className="p-2 rounded bg-muted text-sm mb-2">
            {currentTitle}
          </div>
          <div className="text-xs text-muted-foreground mb-1">New Title</div>
          <div className="p-2 rounded bg-background border font-semibold text-base min-h-[48px] flex items-center">
            {loading && !outlineLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              newTitle || (
                <span className="text-muted-foreground">
                  No title generated
                </span>
              )
            )}
          </div>
          {error && (
            <div className="text-destructive text-xs mt-2">{error}</div>
          )}
        </div>
        {(outline || outlineLoading) && (
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-1">
              Generated Outline
            </div>
            <div className="p-2 rounded bg-background border text-sm whitespace-pre-line max-h-48 overflow-y-auto min-h-[48px]">
              {outlineLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                </>
              ) : outline ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: DomPurity.sanitize(marked.parse(outline) as string),
                  }}
                />
              ) : null}
            </div>
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading || regenerating}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleRegenerate}
            disabled={loading || regenerating}
          >
            {regenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Regenerate
          </Button>
          {outline ? (
            <Button
              type="button"
              className="razor-gradient"
              onClick={handleFinalSave}
              disabled={loading || regenerating}
            >
              Save
            </Button>
          ) : outlineLoading ? (
            <Button type="button" className="razor-gradient" disabled={true}>
              Generating Outline...
            </Button>
          ) : (
            <Button
              type="button"
              className="razor-gradient"
              onClick={handleSaveAndGenerateOutline}
              disabled={loading || regenerating || !newTitle.trim()}
            >
              Save & Generate Outline
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegenerateTitleModal;
