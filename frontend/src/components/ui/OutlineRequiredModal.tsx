import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from './dialog';
import { Button } from './button';
import React from 'react';

interface OutlineRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: () => void;
  loading?: boolean;
}

export const OutlineRequiredModal: React.FC<OutlineRequiredModalProps> = ({
  open,
  onOpenChange,
  onGenerate,
  loading,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Outline Required</DialogTitle>
        <DialogDescription>
          The outline for this topic is not generated yet and is required before approval.<br />
          Please generate the outline first.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button
          className="razor-gradient w-full"
          onClick={onGenerate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Outline'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
); 