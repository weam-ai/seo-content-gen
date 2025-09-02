import React from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  error?: string | null;
  className?: string;
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  status,
  error,
  className,
}) => {
  if (status === 'idle') {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          text: 'Saving...',
          className: 'text-muted-foreground',
        };
      case 'saved':
        return {
          icon: <Check className="h-3 w-3" />,
          text: 'Saved',
          className: 'text-green-600',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: error || 'Save failed',
          className: 'text-red-600',
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs font-medium transition-all duration-200',
        config.className,
        className
      )}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
};
