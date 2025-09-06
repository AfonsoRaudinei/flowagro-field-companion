import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';
import { preloadSystem } from '@/lib/preloadSystem';
import { logger } from '@/lib/logger';

interface LazyLoadConfig {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  preloadDistance?: number;
  priority?: number;
  fallbackDelay?: number;
}

/**
 * Hook otimizado para lazy loading com preload inteligente
 */
export const useOptimizedLazyLoading = <T>(
  loader: () => Promise<T>,
  config: LazyLoadConfig = {}
) => {
  const {
    threshold = 0.1,
    rootMargin = '100px',
    triggerOnce = true,
    preloadDistance = 200,
    priority = 50,
    fallbackDelay = 3000
  } = config;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasLoaded = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { elementRef, isVisible } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce
  });

  // Função de carregamento otimizada
  const loadData = useCallback(async () => {
    if (hasLoaded.current || isLoading) return;

    setIsLoading(true);
    setError(null);
    hasLoaded.current = true;

    const startTime = performance.now();

    try {
      const result = await loader();
      setData(result);
      
      const loadTime = performance.now() - startTime;
      logger.debug('Lazy load completed', { loadTime });
      
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Load failed');
      setError(errorObj);
      hasLoaded.current = false; // Allow retry
      logger.error('Lazy load failed', errorObj);
    } finally {
      setIsLoading(false);
    }
  }, [loader, isLoading]);

  // Trigger loading when visible
  useEffect(() => {
    if (isVisible && !hasLoaded.current) {
      loadData();
    }
  }, [isVisible, loadData]);

  // Fallback timeout para casos onde intersection observer falha
  useEffect(() => {
    if (fallbackDelay > 0) {
      timeoutRef.current = setTimeout(() => {
        if (!hasLoaded.current && !isLoading) {
          logger.debug('Fallback lazy load triggered');
          loadData();
        }
      }, fallbackDelay);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [fallbackDelay, loadData, isLoading]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    elementRef,
    data,
    isLoading,
    error,
    isVisible,
    reload: loadData
  };
};

/**
 * Hook para lazy loading de componentes React
 */
export const useLazyComponent = <P extends object>(
  importFunction: () => Promise<{ default: React.ComponentType<P> }>,
  config: LazyLoadConfig = {}
) => {
  const [Component, setComponent] = useState<React.ComponentType<P> | null>(null);
  
  const { elementRef, data, isLoading, error, isVisible } = useOptimizedLazyLoading(
    importFunction,
    config
  );

  useEffect(() => {
    if (data?.default) {
      setComponent(() => data.default);
    }
  }, [data]);

  return {
    elementRef,
    Component,
    isLoading,
    error,
    isVisible
  };
};

/**
 * Hook para preload de rotas baseado em hover/focus
 */
export const useRoutePreload = () => {
  const preloadRoute = useCallback((routePath: string) => {
    const taskId = `route:${routePath}`;
    
    preloadSystem.registerTask({
      id: taskId,
      priority: 70,
      type: 'route',
      loader: async () => {
        // Preload específico para cada rota do FlowAgro
        switch (routePath) {
          case '/dashboard':
            return import('@/pages/Dashboard');
          case '/technical-map':
            return import('@/pages/TechnicalMap');
          case '/calculator':
            return import('@/pages/Calculator');
          case '/phenological-stages':
            return import('@/pages/PhenologicalStages');
          case '/profile':
            return import('@/pages/Profile');
          case '/settings':
            return import('@/pages/Settings');
          default:
            logger.warn(`No preload configured for route: ${routePath}`);
            return null;
        }
      }
    });

    preloadSystem.executeTask(taskId);
  }, []);

  return { preloadRoute };
};

/**
 * Hook para lazy loading de imagens com placeholder
 */
export const useLazyImage = (src: string, config: LazyLoadConfig = {}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const { elementRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true,
    ...config
  });

  useEffect(() => {
    if (isVisible && !isLoaded) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.onerror = () => {
        logger.error(`Failed to load image: ${src}`);
      };
      img.src = src;
    }
  }, [isVisible, src, isLoaded]);

  return {
    elementRef,
    imageSrc,
    isLoaded,
    isVisible
  };
};

export default useOptimizedLazyLoading;