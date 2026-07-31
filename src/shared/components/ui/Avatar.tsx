import React from 'react';
import { cn } from '../../utils/cn';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ className, src, fallback, size = 'md', ...props }: AvatarProps) {
  const sizes = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  return (
    <div 
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-sidebar-accent border border-slate-700 items-center justify-center",
        sizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-medium uppercase">
          {fallback || '?'}
        </span>
      )}
    </div>
  );
}
