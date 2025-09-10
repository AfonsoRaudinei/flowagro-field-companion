import React, { useState, useRef, useEffect, memo } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  fallbackSrc?: string;
  priority?: 'high' | 'normal' | 'low';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Performance-optimized image component with lazy loading,
 * progressive enhancement, and memory management
 */
export const OptimizedImage = memo<OptimizedImageProps>(({
  src,
  alt,
  placeholder = '/placeholder.svg',
  className,
  fallbackSrc = '/placeholder.svg',
  priority = 'normal',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const imgRef = useRef<HTMLImageElement>(null);

  // Only use intersection observer for non-priority images
  const shouldLazyLoad = priority !== 'high';
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
    root: null,
    rootMargin: '50px'
  });

  // Determine if image should be loaded
  const shouldLoad = !shouldLazyLoad || isVisible;

  useEffect(() => {
    if (!shouldLoad || hasError) return;

    const img = new Image();
    
    const handleLoad = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      if (fallbackSrc && fallbackSrc !== src) {
        setCurrentSrc(fallbackSrc);
      }
      setHasError(true);
      onError?.();
    };

    img.onload = handleLoad;
    img.onerror = handleError;
    
    // Start loading
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, shouldLoad, hasError, fallbackSrc, onLoad, onError]);

  return (
    <div
      ref={(el) => {
        if (shouldLazyLoad) {
          elementRef.current = el as HTMLElement;
        }
      }}
      className={cn("relative overflow-hidden", className)}
    >
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        loading={priority === 'high' ? 'eager' : 'lazy'}
        decoding="async"
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          hasError && "opacity-50"
        )}
        onLoad={() => {
          if (currentSrc !== placeholder) {
            setIsLoaded(true);
            onLoad?.();
          }
        }}
        onError={() => {
          if (!hasError && fallbackSrc && currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
          } else {
            setHasError(true);
            onError?.();
          }
        }}
      />
      
      {/* Loading state */}
      {!isLoaded && shouldLoad && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      
      {/* Not visible placeholder */}
      {!shouldLoad && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
          <div className="text-xs text-muted-foreground">📷</div>
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';