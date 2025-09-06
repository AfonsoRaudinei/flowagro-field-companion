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
export { MapErrorBoundary } from '../MapErrorBoundary';

// Component registry for lazy loading
export { 
  preloadMapComponent,
  preloadCriticalMapComponents 
} from '../MapComponentRegistry';