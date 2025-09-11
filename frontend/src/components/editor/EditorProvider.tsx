import { Skeleton } from '@/components/ui/skeleton';
import { BlockNoteEditor } from './BlockNoteEditor';
import { useEffect, useState, forwardRef } from 'react';

interface EditorProviderProps {
  docId: string;
  initialContent?: any;
  onContentChange?: (content: any) => void;
  onSave?: (content: any) => void;
  onTokenReceived?: (token: any) => void;
}

export const EditorProvider = forwardRef<any, EditorProviderProps>(
  ({
    docId,
    initialContent,
    onContentChange,
    onSave,
    onTokenReceived,
  }, ref) => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (docId) {
        // Simulate loading for single-user mode (no collaboration needed)
        const timer = setTimeout(() => {
          setLoading(false);
          // Provide mock token data for single-user mode
          if (onTokenReceived) {
            onTokenReceived({
              token: 'single-user-mode',
              url: null, // No WebSocket needed for single-user
              docId: docId
            });
          }
        }, 100);

        return () => clearTimeout(timer);
      }
    }, [docId, onTokenReceived]);

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
