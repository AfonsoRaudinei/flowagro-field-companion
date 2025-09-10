import React, { Suspense, memo } from 'react';
import { cn } from '@/lib/utils';

interface LoadingBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * Performance-optimized loading boundary for dashboard components
 * Provides smooth loading states and error boundaries
 */
export const LoadingBoundary = memo<LoadingBoundaryProps>(({
  children,
  fallback = <DefaultLoadingFallback />,
  className
}) => {
  return (
    <Suspense fallback={fallback}>
      <div className={cn("animate-fade-in", className)}>
        {children}
      </div>
    </Suspense>
  );
});

/**
 * Default loading skeleton that matches dashboard aesthetics
 */
const DefaultLoadingFallback = memo(() => {
  return (
    <div className="flex flex-col space-y-4 p-4 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-32" />
        <div className="h-3 bg-muted/60 rounded w-48" />
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card/95 rounded-2xl p-3 sm:p-4 min-h-[80px] sm:min-h-[90px] border border-border/50">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-muted/40 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted/60 rounded w-20" />
                <div className="h-2 bg-muted/40 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

DefaultLoadingFallback.displayName = 'DefaultLoadingFallback';
LoadingBoundary.displayName = 'LoadingBoundary';