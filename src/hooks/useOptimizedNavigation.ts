import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { performanceMonitor } from '@/lib/unifiedPerformance';
import { logger } from '@/lib/logger';

/**
 * Optimized navigation hook with preloading and performance monitoring
 */
export function useOptimizedNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigationStartTime = useRef<number>(0);

  // Preload critical routes on hover/focus
  const preloadRoute = useCallback((routePath: string) => {
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }

    preloadTimeoutRef.current = setTimeout(() => {
      performanceMonitor.measure('route-preload', () => {
        switch (routePath) {
          case '/dashboard':
            import('@/pages/Dashboard');
            break;
          case '/technical-map':
            import('@/pages/TechnicalMapSimplified');
            break;
          case '/calculator':
            import('@/pages/Calculator');
            break;
          case '/settings':
            import('@/pages/Settings');
            break;
          default:
            logger.debug('No preload available for route', { routePath });
        }
      });
    }, 100); // Small delay to avoid preloading on quick hovers
  }, []);

  // Optimized navigation with performance tracking
  const navigateToRoute = useCallback((
    routePath: string, 
    options?: { replace?: boolean; state?: any }
  ) => {
    navigationStartTime.current = performance.now();
    
    performanceMonitor.measure('navigation-start', () => {
      if (options?.replace) {
        navigate(routePath, { replace: true, state: options.state });
      } else {
        navigate(routePath, { state: options?.state });
      }
    });
  }, [navigate]);

  // Track route changes for performance monitoring
  useEffect(() => {
    if (navigationStartTime.current > 0) {
      const navigationTime = performance.now() - navigationStartTime.current;
      performanceMonitor.measure('route-change-complete', () => {
        logger.info('Route change completed', {
          path: location.pathname,
          duration: navigationTime
        });
      });
      navigationStartTime.current = 0;
    }
  }, [location.pathname]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
        preloadTimeoutRef.current = null;
      }
    };
  }, []);

  // Route utilities
  const isActiveRoute = useCallback((routePath: string) => {
    return location.pathname === routePath;
  }, [location.pathname]);

  const getRouteTitle = useCallback((routePath: string) => {
    const titles: Record<string, string> = {
      '/dashboard': 'Chat',
      '/technical-map': 'Mapa',
      '/calculator': 'Calculadora',
      '/settings': 'Configurações',
      '/profile': 'Perfil'
    };
    return titles[routePath] || 'FlowAgro';
  }, []);

  return {
    currentPath: location.pathname,
    navigate: navigateToRoute,
    preloadRoute,
    isActiveRoute,
    getRouteTitle,
    locationState: location.state
  };
}