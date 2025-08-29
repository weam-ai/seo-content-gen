'use client';

import { Zap } from 'lucide-react';
import { useState } from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  onClick?: () => void;
}

export function Logo({ className = '', showText = true, onClick }: LogoProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`flex items-center gap-2 cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className={`relative ${isHovered ? 'wiggle' : ''}`}>
        <Zap className="h-8 w-8 text-[hsl(var(--razor-primary))] fill-current transition-all duration-300" />
        <div className="absolute inset-0 h-8 w-8 text-[hsl(var(--razor-secondary))] opacity-30 blur-sm">
          <Zap className="h-8 w-8 fill-current" />
        </div>
      </div>
      {showText && (
        <span
          className={`text-2xl font-bold razor-gradient-text transition-all duration-300 ${
            isHovered ? 'scale-105' : ''
          }`}
        >
          Razorcopy
        </span>
      )}
    </div>
  );
}
