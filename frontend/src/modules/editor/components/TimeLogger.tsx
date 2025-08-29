import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Pause, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useEditor from '../hooks/useEditor';

interface TimeLoggerProps {
  onTimeUpdate?: (totalSeconds: number) => void;
}

export const TimeLogger: React.FC<TimeLoggerProps> = ({ onTimeUpdate }) => {
  const { articleId } = useParams<{ articleId: string }>();
  const {
    isTimeTracking,
    totalTimeSeconds,
    startTimeTracking,
    pauseTimeTracking,
    isLoading,
  } = useEditor();

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Call onTimeUpdate when totalTimeSeconds changes
  useEffect(() => {
    onTimeUpdate?.(totalTimeSeconds);
  }, [totalTimeSeconds, onTimeUpdate]);

  const toggleTimer = async () => {
    if (!articleId) return;

    if (isTimeTracking) {
      await pauseTimeTracking(articleId);
    } else {
      await startTimeTracking(articleId);
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-md border border-border/50">
      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTimer}
        disabled={isLoading || !articleId}
        className={`p-1.5 h-7 w-7 hover:bg-white/80 transition-colors ${
          isTimeTracking
            ? 'text-green-600 hover:text-green-700'
            : 'text-muted-foreground hover:text-foreground'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isTimeTracking ? 'Pause Timer' : 'Start Timer'}
      >
        {isTimeTracking ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
      </Button>

      {/* Time Display */}
      <div className="flex items-center gap-1.5 text-sm">
        <Clock className="h-3 w-3 text-muted-foreground" />
        <span
          className={`font-mono font-medium text-xs ${
            isTimeTracking ? 'text-green-700' : 'text-muted-foreground'
          }`}
        >
          {formatTime(totalTimeSeconds)}
        </span>
      </div>
    </div>
  );
};
