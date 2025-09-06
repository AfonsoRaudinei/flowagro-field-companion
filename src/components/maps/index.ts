/**
 * Maps Module - Unified Export System
 * 
 * Central export point for all map components
 * organized by functional modules
 */

// Core functionality
export * from './core';

// User controls and navigation
export * from './controls';

// Analysis and data tools
export * from './analysis';

// Interactive elements
export * from './interactions';

// Layout and responsive design
export * from './layout';

// Performance and debugging
export * from './performance';

// Legacy direct exports for backward compatibility
// These will be deprecated in future versions

// Core components
export { BaseMap } from './BaseMap';
export { SimpleBaseMap } from './SimpleBaseMap';
export { IntegratedMapInterface } from './IntegratedMapInterface';
export { MapProvider, useMap } from './MapProvider';

// Most commonly used components
export { PremiumMapControls } from './PremiumMapControls';
export { NavigationControlsHub } from './NavigationControlsHub';
export { EnhancedMapClickPopover } from './EnhancedMapClickPopover';
export { DrawingToolsPanel } from './DrawingToolsPanel';
export { NDVIAnalysis } from './NDVIAnalysis';

// Utility functions
export { preloadMapComponent, preloadCriticalMapComponents } from './MapComponentRegistry';