import type { Map as MapboxMap } from 'mapbox-gl';

export interface ViewportState {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

export class ViewportManager {
  private static instance: ViewportManager;
  private savedViewports: Map<string, ViewportState> = new Map();

  static getInstance(): ViewportManager {
    if (!ViewportManager.instance) {
      ViewportManager.instance = new ViewportManager();
    }
    return ViewportManager.instance;
  }

  getCurrentViewport(map: MapboxMap): ViewportState {
    return {
      center: map.getCenter().toArray() as [number, number],
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing()
    };
  }

  saveViewport(key: string, viewport: ViewportState): void {
    this.savedViewports.set(key, viewport);
    
    // Persist to localStorage for session recovery
    try {
      const saved = Object.fromEntries(this.savedViewports);
      localStorage.setItem('mapViewports', JSON.stringify(saved));
    } catch (error) {
      console.warn('Failed to save viewport to localStorage:', error);
    }
  }

  restoreViewport(key: string): ViewportState | null {
    return this.savedViewports.get(key) || null;
  }

  applyViewport(map: MapboxMap, viewport: ViewportState, animated: boolean = true): void {
    if (animated) {
      map.flyTo({
        center: viewport.center,
        zoom: viewport.zoom,
        pitch: viewport.pitch,
        bearing: viewport.bearing,
        duration: 800,
        essential: true
      });
    } else {
      map.jumpTo({
        center: viewport.center,
        zoom: viewport.zoom,
        pitch: viewport.pitch,
        bearing: viewport.bearing
      });
    }
  }

  // Smart viewport transition for fullscreen
  optimizeForFullscreen(map: MapboxMap): ViewportState {
    const current = this.getCurrentViewport(map);
    
    // Adjust zoom and pitch for better fullscreen experience
    return {
      ...current,
      zoom: Math.min(current.zoom + 0.5, 18), // Slight zoom in
      pitch: Math.min(current.pitch + 10, 60), // Add some 3D perspective
    };
  }

  // Restore optimal view when exiting fullscreen
  optimizeForWindowed(viewport: ViewportState): ViewportState {
    return {
      ...viewport,
      zoom: Math.max(viewport.zoom - 0.5, 1), // Slight zoom out
      pitch: Math.max(viewport.pitch - 10, 0), // Reduce 3D perspective
    };
  }

  // Load saved viewports from localStorage
  loadSavedViewports(): void {
    try {
      const saved = localStorage.getItem('mapViewports');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.savedViewports = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load saved viewports:', error);
    }
  }

  // Clear all saved viewports
  clearSavedViewports(): void {
    this.savedViewports.clear();
    localStorage.removeItem('mapViewports');
  }
}