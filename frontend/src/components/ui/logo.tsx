'use client';

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
        <img src="/logo.svg" alt="Weam" className="h-8 w-8 object-contain" />
      </div>
      {showText && (
        <span
          className={`text-2xl font-bold razor-gradient-text transition-all duration-300 ${
            isHovered ? 'scale-105' : ''
          }`}
        >
          Weam
        </span>
      )}
    </div>
  );
}
