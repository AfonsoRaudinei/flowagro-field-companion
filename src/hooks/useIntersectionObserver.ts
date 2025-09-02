import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
  triggerOnce?: boolean;
}

/**
 * Hook for lazy loading and visibility detection
 */
export const useIntersectionObserver = (
  options: UseIntersectionObserverOptions = {}
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const { freezeOnceVisible = false, triggerOnce = false, ...intersectionOptions } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Don't re-observe if frozen and already visible
    if (freezeOnceVisible && hasBeenVisible) return;

    observer.current = new IntersectionObserver(
      ([entry]) => {
        const isElementVisible = entry.isIntersecting;
        
        setIsVisible(isElementVisible);
        
        if (isElementVisible && !hasBeenVisible) {
          setHasBeenVisible(true);
          
          // Disconnect if triggerOnce
          if (triggerOnce && observer.current) {
            observer.current.disconnect();
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...intersectionOptions
      }
    );

    observer.current.observe(element);

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [freezeOnceVisible, hasBeenVisible, triggerOnce, intersectionOptions]);

  return {
    elementRef,
    isVisible: freezeOnceVisible ? hasBeenVisible : isVisible,
    hasBeenVisible
  };
};

/**
 * Hook for lazy loading components with Suspense
 */
export const useLazyComponent = <T extends React.ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  options: UseIntersectionObserverOptions = {}
) => {
  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { elementRef, isVisible } = useIntersectionObserver(options);

  useEffect(() => {
    if (isVisible && !Component && !isLoading) {
      setIsLoading(true);
      setError(null);

      importFunction()
        .then(({ default: LoadedComponent }) => {
          setComponent(() => LoadedComponent);
        })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error('Failed to load component'));
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isVisible, Component, isLoading, importFunction]);

  return {
    elementRef,
    Component,
    isLoading,
    error,
    isVisible
  };
};

/**
 * Hook for viewport-based data loading
 */
export const useViewportDataLoader = <T>(
  fetchFunction: () => Promise<T>,
  options: UseIntersectionObserverOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { elementRef, isVisible } = useIntersectionObserver({
    triggerOnce: true,
    ...options
  });

  useEffect(() => {
    if (isVisible && !data && !isLoading) {
      setIsLoading(true);
      setError(null);

      fetchFunction()
        .then(setData)
        .catch((err) => {
          setError(err instanceof Error ? err : new Error('Failed to fetch data'));
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isVisible, data, isLoading, fetchFunction]);

  return {
    elementRef,
    data,
    isLoading,
    error,
    isVisible
  };
};