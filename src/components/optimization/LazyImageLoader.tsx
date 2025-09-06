import React, { useState, useRef, useEffect } from 'react';
import { useLazyImage } from '@/hooks/useOptimizedLazyLoading';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LazyImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  priority?: 'high' | 'normal' | 'low';
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Componente otimizado para carregamento lazy de imagens
 * com skeleton loading e suporte a prioridades
 */
export const LazyImageLoader: React.FC<LazyImageLoaderProps> = ({
  src,
  alt,
  className = '',
  skeletonClassName = '',
  priority = 'normal',
  placeholder,
  onLoad,
  onError
}) => {
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const { elementRef, imageSrc, isLoaded, isVisible } = useLazyImage(src, {
    priority: priority === 'high' ? 90 : priority === 'normal' ? 50 : 20,
    threshold: priority === 'high' ? 0.1 : 0.2,
    rootMargin: priority === 'high' ? '100px' : '50px'
  });

  // Handle image load/error events
  useEffect(() => {
    if (isLoaded && imageSrc) {
      const img = imgRef.current;
      if (img) {
        img.onload = () => {
          onLoad?.();
        };
        img.onerror = () => {
          setHasError(true);
          onError?.();
        };
      }
    }
  }, [isLoaded, imageSrc, onLoad, onError]);

  // Show skeleton while not visible or loading
  if (!isVisible || (!isLoaded && !hasError)) {
    return (
      <div ref={elementRef as any} className={cn('relative overflow-hidden', className)}>
        <Skeleton className={cn('w-full h-full', skeletonClassName)} />
        {placeholder && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            {placeholder}
          </div>
        )}
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className={cn('relative overflow-hidden bg-muted flex items-center justify-center', className)}>
        <div className="text-muted-foreground text-sm text-center p-4">
          <div className="mb-2">❌</div>
          <div>Erro ao carregar imagem</div>
        </div>
      </div>
    );
  }

  // Show loaded image
  return (
    <div ref={elementRef} className={cn('relative overflow-hidden', className)}>
      <img
        ref={imgRef}
        src={imageSrc || src}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-300"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};

export default LazyImageLoader;