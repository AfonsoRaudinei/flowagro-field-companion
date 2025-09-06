/**
 * Maps Module Architecture - Core Components
 * 
 * Core map functionality including base components,
 * context providers, and essential services
 */

// Core map components
export { BaseMap } from '../BaseMap';
export { SimpleBaseMap } from '../SimpleBaseMap';
export { IntegratedMapInterface } from '../IntegratedMapInterface';

// Context and providers
export { MapProvider, useMap } from '../MapProvider';

// Error handling
export { 
  UnifiedErrorBoundary,
  ErrorBoundary,
  ChatErrorBoundary,
  MapErrorBoundary,
  PerformanceErrorBoundary
} from '@/components/errors/UnifiedErrorBoundary';

// Component registry for lazy loading
export { 
  preloadMapComponent,
  preloadCriticalMapComponents 
} from '../MapComponentRegistry';