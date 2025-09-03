import React, { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';

/**
 * Map Component Registry - Dynamic imports for better tree shaking
 * Only loads components when actually needed
 */

// Core components - loaded immediately
export { SimpleBaseMap } from './SimpleBaseMap';
export { MapProvider, useMap } from './MapProvider';

// Essential components - lazy loaded
const LazyPremiumMapControls = lazy(() => 
  import('./PremiumMapControls').then(module => ({ 
    default: module.PremiumMapControls 
  }))
);

const LazyNavigationControlsHub = lazy(() => 
  import('./NavigationControlsHub').then(module => ({ 
    default: module.NavigationControlsHub 
  }))
);

const LazyDrawingToolsPanel = lazy(() => 
  import('./DrawingToolsPanel').then(module => ({ 
    default: module.DrawingToolsPanel 
  }))
);

const LazyLocationTracker = lazy(() => 
  import('./LocationTracker').then(module => ({ 
    default: module.LocationTracker 
  }))
);

// Advanced components - aggressive lazy loading
const LazyNDVIAnalysis = lazy(() => 
  import('./NDVIAnalysis').then(module => ({ 
    default: module.NDVIAnalysis 
  }))
);

const LazyNDVIControls = lazy(() => 
  import('./NDVIControls').then(module => ({ 
    default: module.NDVIControls 
  }))
);

const LazyNDVIHistory = lazy(() => import('./NDVIHistory'));

const LazyTemporalNavigator = lazy(() => 
  import('./TemporalNavigator').then(module => ({ 
    default: module.TemporalNavigator 
  }))
);

const LazyMeasurementToolsPanel = lazy(() => 
  import('./MeasurementToolsPanel').then(module => ({ 
    default: module.MeasurementToolsPanel 
  }))
);

const LazySmartMarkerSystem = lazy(() => 
  import('./SmartMarkerSystem').then(module => ({ 
    default: module.SmartMarkerSystem 
  }))
);

// Development/Debug components - only in dev mode
let LazyDiagnosticPanel: React.LazyExoticComponent<any> | null = null;
let LazyRealTimeMetricsPanel: React.LazyExoticComponent<any> | null = null;

if (import.meta.env.DEV) {
  LazyDiagnosticPanel = lazy(() => 
    import('./DiagnosticPanel').then(module => ({ 
      default: module.DiagnosticPanel 
    }))
  );
  
  LazyRealTimeMetricsPanel = lazy(() => 
    import('./RealTimeMetricsPanel').then(module => ({ 
      default: module.RealTimeMetricsPanel 
    }))
  );
}

// Fallback component for loading states
const MapComponentFallback = ({ className }: { className?: string }) => (
  <Skeleton className={`h-12 w-full ${className}`} />
);

// Component wrapper with error boundary
const withMapComponentWrapper = <T extends {}>(
  Component: React.LazyExoticComponent<React.ComponentType<T>>,
  fallbackClassName?: string
) => {
  return React.forwardRef<any, T>((props, ref) => (
    <Suspense fallback={<MapComponentFallback className={fallbackClassName} />}>
      <Component {...props} ref={ref} />
    </Suspense>
  ));
};

// Export wrapped components with proper fallbacks
export const PremiumMapControls = withMapComponentWrapper(LazyPremiumMapControls, 'h-16');
export const NavigationControlsHub = withMapComponentWrapper(LazyNavigationControlsHub, 'h-12');
export const DrawingToolsPanel = withMapComponentWrapper(LazyDrawingToolsPanel, 'h-20');
export const LocationTracker = withMapComponentWrapper(LazyLocationTracker, 'h-8');
export const NDVIAnalysis = withMapComponentWrapper(LazyNDVIAnalysis, 'h-32');
export const NDVIControls = withMapComponentWrapper(LazyNDVIControls, 'h-16');
export const NDVIHistory = withMapComponentWrapper(LazyNDVIHistory, 'h-48');
export const TemporalNavigator = withMapComponentWrapper(LazyTemporalNavigator, 'h-24');
export const MeasurementToolsPanel = withMapComponentWrapper(LazyMeasurementToolsPanel, 'h-20');
export const SmartMarkerSystem = withMapComponentWrapper(LazySmartMarkerSystem, 'h-16');

// Additional components that weren't lazy loaded originally
export { LocationFooter } from './LocationFooter';
export { ResponsiveBottomSheet } from './ResponsiveBottomSheet';

// Development components - only exported in dev mode
export const DiagnosticPanel = import.meta.env.DEV && LazyDiagnosticPanel ? 
  withMapComponentWrapper(LazyDiagnosticPanel, 'h-24') : 
  null;

export const RealTimeMetricsPanel = import.meta.env.DEV && LazyRealTimeMetricsPanel ? 
  withMapComponentWrapper(LazyRealTimeMetricsPanel, 'h-16') : 
  null;

// Utility function to preload specific components
export const preloadMapComponent = (componentName: string) => {
  if (import.meta.env.DEV) {
    logger.debug('Preloading map component', { componentName });
  }
  
  switch (componentName) {
    case 'PremiumMapControls':
      return import('./PremiumMapControls');
    case 'NavigationControlsHub':
      return import('./NavigationControlsHub');
    case 'DrawingToolsPanel':
      return import('./DrawingToolsPanel');
    case 'NDVIAnalysis':
      return import('./NDVIAnalysis');
    case 'NDVIControls':
      return import('./NDVIControls');
    case 'TemporalNavigator':
      return import('./TemporalNavigator');
    default:
      return Promise.resolve();
  }
};

// Bulk preload function
export const preloadCriticalMapComponents = async () => {
  if (typeof window === 'undefined') return;
  
  const criticalComponents = [
    'PremiumMapControls',
    'NavigationControlsHub',
    'DrawingToolsPanel'
  ];
  
  return Promise.all(
    criticalComponents.map(component => preloadMapComponent(component))
  );
};