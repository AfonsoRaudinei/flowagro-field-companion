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
 * Enhanced loading skeleton with smooth animations and better UX
 */
const DefaultLoadingFallback = memo(() => {
  return (
    <div className="flex flex-col space-y-4 p-4">
      {/* Animated header skeleton */}
      <div className="space-y-2 animate-fade-in">
        <div className="h-4 bg-gradient-to-r from-muted via-muted/80 to-muted rounded w-32 animate-pulse" />
        <div className="h-3 bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 rounded w-48 animate-pulse" />
      </div>
      
      {/* Enhanced grid skeleton with staggered animation */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            className="bg-card/95 rounded-2xl p-3 sm:p-4 min-h-[80px] sm:min-h-[90px] border border-border/50 animate-scale-in"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gradient-to-r from-muted/60 to-muted/40 rounded w-20 animate-pulse" />
                <div className="h-2 bg-gradient-to-r from-muted/40 to-muted/20 rounded w-16 animate-pulse" />
              </div>
            </div>
            
            {/* Loading dots animation */}
            <div className="flex justify-center mt-2">
              <div className="flex space-x-1">
                {[0, 1, 2].map((dot) => (
                  <div
                    key={dot}
                    className="w-1 h-1 bg-muted/60 rounded-full animate-pulse"
                    style={{ animationDelay: `${dot * 200}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Progress indicator */}
      <div className="flex justify-center mt-6">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="animate-fade-in">Carregando dados...</span>
        </div>
      </div>
    </div>
  );
});

DefaultLoadingFallback.displayName = 'DefaultLoadingFallback';
LoadingBoundary.displayName = 'LoadingBoundary';