import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Clock } from 'lucide-react';

interface FloatingTimeLoggerProps {
  onTimeUpdate?: (totalSeconds: number) => void;
}

export const FloatingTimeLogger: React.FC<FloatingTimeLoggerProps> = ({
  onTimeUpdate,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [position, setPosition] = useState({ x: 4, y: 64 }); // top-4 right-4 equivalent
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const componentRef = useRef<HTMLDivElement>(null);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        setTotalSeconds((prev) => {
          const newTotal = prev + 1;
          onTimeUpdate?.(newTotal);
          return newTotal;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, onTimeUpdate]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (componentRef.current) {
      const rect = componentRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep within viewport bounds
      const maxX = window.innerWidth - (componentRef.current?.offsetWidth || 0);
      const maxY =
        window.innerHeight - (componentRef.current?.offsetHeight || 0);

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={componentRef}
      className="fixed z-40"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div
        className={`bg-white backdrop-blur-sm rounded-full pl-2 pr-3 py-2 flex items-center gap-3 shadow-sm border border-border/50 transition-shadow ${
          isDragging
            ? 'shadow-lg cursor-grabbing'
            : 'cursor-grab hover:shadow-md'
        }`}
        onMouseDown={handleMouseDown}
      >
        {/* Play/Pause Button */}
        <button
          onClick={toggleTimer}
          onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking button
          className="w-8 h-8 rounded-full bg-muted/90 hover:bg-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
        >
          {isRunning ? (
            <Pause className="h-4 w-4 text-gray-700" />
          ) : (
            <Play className="h-4 w-4 text-gray-700 ml-0.5" />
          )}
        </button>

        {/* Time Display */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Time Tracked:</span>
          <span className="text-sm font-mono font-semibold text-foreground">
            {formatTime(totalSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
};
