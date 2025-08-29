import React from 'react';
import { Button } from '@/components/ui/button';
import { Minimize2 } from 'lucide-react';

interface FocusModeExitButtonProps {
  onExit: () => void;
}

export const FocusModeExitButton: React.FC<FocusModeExitButtonProps> = ({
  onExit,
}) => {
  return (
    <div className="fixed top-6 right-6 z-50 group">
      <Button
        onClick={onExit}
        size="sm"
        variant="secondary"
        className="backdrop-blur-sm bg-background/90 border border-border/50 shadow-lg hover:bg-background transition-all duration-200 opacity-60 hover:opacity-100"
      >
        <Minimize2 className="h-4 w-4 mr-2" />
        Exit Focus Mode
        <span className="ml-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          ESC
        </span>
      </Button>
    </div>
  );
};
