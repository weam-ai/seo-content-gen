import { Skeleton } from '@/components/ui/skeleton';
import { BlockNoteEditor } from './BlockNoteEditor';
import { useState, forwardRef } from 'react';

interface EditorProviderProps {
  docId: string;
  initialContent?: any;
  onContentChange?: (content: any) => void;
  onSave?: (content: any) => void;
}

export const EditorProvider = forwardRef<any, EditorProviderProps>(
  ({
    docId,
    initialContent,
    onContentChange,
    onSave,
  }, ref) => {
    const [loading] = useState(false);
    const [error] = useState<string | null>(null);

    if (loading)
      return (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <Skeleton className="w-3/4 h-8 mb-4" />
          <Skeleton className="w-full h-48 mb-2" />
          <Skeleton className="w-1/2 h-6" />
          <div className="mt-4 text-muted-foreground text-sm">
            Loading editor...
          </div>
        </div>
      );

    if (error) return <div className="text-red-500">Error: {error}</div>;

    return (
      <BlockNoteEditor
        ref={ref}
        docId={docId}
        initialContent={initialContent}
        onContentChange={onContentChange}
        onSave={onSave}
      />
    );
  }
);
