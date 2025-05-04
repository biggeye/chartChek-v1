'use client';

import { Loader2 } from 'lucide-react';
import { AppLogo } from './app-logo';
import { cn } from '@kit/ui/utils';

interface LoaderProps {
  /** Full screen mode takes up entire viewport height */
  fullScreen?: boolean;
  /** Show the app logo */
  showLogo?: boolean;
  /** Custom loading message */
  message?: string;
  /** Size of the loader icon (default: 'default') */
  size?: 'sm' | 'default' | 'lg';
  /** Additional CSS classes for the container */
  className?: string;
  /** Additional CSS classes for the logo */
  logoClassName?: string;
}

const sizeClasses = {
  sm: 'h-3 w-3',
  default: 'h-4 w-4',
  lg: 'h-6 w-6'
} as const;

const logoSizeClasses = {
  sm: 'h-8',
  default: 'h-12',
  lg: 'h-16'
} as const;

export function Loader({
  fullScreen = false,
  showLogo = true,
  message = 'Loading your workspace...',
  size = 'default',
  className,
  logoClassName
}: LoaderProps) {
  return (
    <div className={cn(
      'bg-background flex items-center justify-center',
      fullScreen && 'min-h-screen',
      className
    )}>
      <div className="flex flex-col items-center gap-4">
        {showLogo && (
          <AppLogo 
            className={cn(
              'w-auto animate-pulse',
              logoSizeClasses[size],
              logoClassName
            )} 
          />
        )}
        <div className="flex items-center gap-2">
          <Loader2 
            className={cn(
              'animate-spin text-primary',
              sizeClasses[size]
            )} 
          />
          <span className={cn(
            'text-muted-foreground',
            size === 'sm' && 'text-xs',
            size === 'default' && 'text-sm',
            size === 'lg' && 'text-base'
          )}>
            {message}
          </span>
        </div>
      </div>
    </div>
  );
}