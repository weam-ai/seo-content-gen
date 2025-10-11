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
        <img src={`${import.meta.env.VITE_FRONTEND_URL}logo.svg`} alt="Weam AI" className="h-8 w-8 object-contain" />
      </div>
      {showText && (
        <span
          className={`font-semibold text-gray-900 dark:text-white`}
        >
          Weam AI
        </span>
      )}
    </div>
  );
}
