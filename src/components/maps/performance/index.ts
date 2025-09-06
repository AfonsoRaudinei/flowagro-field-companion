/**
 * Maps Module Architecture - Performance & Debug
 * 
 * Performance optimization, debug tools,
 * diagnostics, and development utilities
 */

// Performance optimization
export { TileLoadingOptimizer } from '../TileLoadingOptimizer';
export { MobileRenderOptimizer } from '../MobileRenderOptimizer';

// Debug and diagnostics
export { DiagnosticPanel } from '../DiagnosticPanel';

// Development tools (only in dev mode)
export const DevComponents = {
  get DiagnosticPanel() {
    return import.meta.env.DEV ? require('../DiagnosticPanel').DiagnosticPanel : null;
  },
  get RealTimeMetricsPanel() {
    return import.meta.env.DEV ? require('../RealTimeMetricsPanel').RealTimeMetricsPanel : null;
  }
};