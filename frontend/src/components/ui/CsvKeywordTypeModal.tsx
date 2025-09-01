import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PromptType {
  _id: string;
  name: string;
}

interface CsvKeywordTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keywords: string[];
  setKeywords: (updater: (prev: string[]) => string[]) => void;
  keywordTypes: { [k: string]: string };
  setKeywordTypes: (
    updater: (prev: { [k: string]: string }) => { [k: string]: string }
  ) => void;
  promptTypes: PromptType[];
  error?: string | null;
  onApply: () => void;
  onCancel: () => void;
  setError?: (err: string | null) => void;
  loading?: boolean;
}

const CsvKeywordTypeModal: React.FC<CsvKeywordTypeModalProps> = ({
  open,
  onOpenChange,
  keywords,
  setKeywords,
  keywordTypes,
  setKeywordTypes,
  promptTypes,
  error,
  onApply,
  onCancel,
  setError,
  loading,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Article Type to Keywords</DialogTitle>
          <DialogDescription>
            Select an article type for each keyword. You can also set all to one
            type below.
          </DialogDescription>
        </DialogHeader>
        {keywords.length > 1 && (
          <div className="mb-2 flex gap-2 items-center">
            <span className="text-sm">Set all to:</span>
            <Select
              value={''}
              onValueChange={(val) => {
                setKeywordTypes((prev) => {
                  const updated = { ...prev };
                  keywords.forEach((k) => {
                    updated[k] = val;
                  });
                  return updated;
                });
                setError?.(null);
              }}
            >
              <SelectTrigger className="w-48 pl-2 focus:ring-0 focus:ring-transparent focus:outline-none">
                <SelectValue placeholder="Select article type" />
              </SelectTrigger>
              <SelectContent>
                {promptTypes.map((type) => (
                  <SelectItem key={type._id} value={type._id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="max-h-60 overflow-y-auto mb-4">
          {keywords.map((kw) => (
            <div key={kw} className="flex gap-2 items-center mb-2">
              <span className="flex-1 text-sm">{kw}</span>
              <Select
                value={keywordTypes[kw] || ''}
                onValueChange={(val) => {
                  setKeywordTypes((prev) => ({ ...prev, [kw]: val }));
                  setError?.(null);
                }}
              >
                <SelectTrigger className="w-48 pl-2 focus:ring-0 focus:ring-transparent focus:outline-none">
                  <SelectValue placeholder="Select article type" />
                </SelectTrigger>
                <SelectContent>
                  {promptTypes.map((type) => (
                    <SelectItem key={type._id} value={type._id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {keywords.length > 1 && (
                <button
                  type="button"
                  className="ml-2 text-red-500 hover:text-red-700 text-lg font-bold px-2"
                  title="Remove keyword"
                  onClick={() => {
                    setKeywords((prev) => prev.filter((k) => k !== kw));
                    setKeywordTypes((prev) => {
                      const updated = { ...prev };
                      delete updated[kw];
                      return updated;
                    });
                    setError?.(null);
                  }}
                  disabled={loading}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
        <DialogFooter>
          <Button
            type="button"
            onClick={onApply}
            disabled={loading}
            className="bg-[hsl(var(--razor-primary))]"
          >
            {loading ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2 w-4 h-4 border-2 border-t-transparent border-white rounded-full"></span>
                Applying...
              </span>
            ) : (
              <>Apply ({keywords.length} keywords)</>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CsvKeywordTypeModal;
