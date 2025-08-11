import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface MapCoreOptions {
  center?: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  style?: string;
  maxZoom?: number;
  minZoom?: number;
}

interface MapCoreProps {
  options?: MapCoreOptions;
  onMapLoad?: (map: maplibregl.Map) => void;
  onMapMove?: (e: maplibregl.MapEventType['move']) => void;
  onMapRotate?: (e: maplibregl.MapEventType['rotate']) => void;
  className?: string;
  children?: React.ReactNode;
}

const DEFAULT_OPTIONS: MapCoreOptions = {
  center: [-15.7975, -47.8919], // Brasília
  zoom: 10,
  bearing: 0,
  pitch: 0,
  maxZoom: 22,
  minZoom: 1
};

const MapCore: React.FC<MapCoreProps> = ({
  options = {},
  onMapLoad,
  onMapMove,
  onMapRotate,
  className = "w-full h-full",
  children
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Fallback tile source - robust and always available
  const getFallbackStyle = useCallback((): maplibregl.StyleSpecification => ({
    version: 8 as const,
    sources: {
      'satellite': {
        type: 'raster',
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [{
      id: 'satellite',
      type: 'raster',
      source: 'satellite'
    }]
  }), []);

  // Primary style with MapTiler fallback
  const getMapStyle = useCallback((): maplibregl.StyleSpecification => {
    const { style = 'satellite' } = options;
    
    // Try MapTiler first, fallback to reliable source
    if (style === 'satellite') {
      return {
        version: 8 as const,
        sources: {
          'satellite': {
            type: 'raster',
            tiles: [
              'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=demo', // Demo key
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png' // Fallback
            ],
            tileSize: 256,
            attribution: '© MapTiler © OpenStreetMap contributors'
          }
        },
        layers: [{
          id: 'satellite',
          type: 'raster',
          source: 'satellite'
        }]
      };
    }
    
    return getFallbackStyle();
  }, [options.style, getFallbackStyle]);

  const initializeMap = useCallback(() => {
    if (!mapContainer.current || map.current) return;

    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: getMapStyle(),
        center: mergedOptions.center,
        zoom: mergedOptions.zoom,
        bearing: mergedOptions.bearing,
        pitch: mergedOptions.pitch,
        maxZoom: mergedOptions.maxZoom,
        minZoom: mergedOptions.minZoom,
        
      });

      // Event listeners
      map.current.on('load', () => {
        if (map.current) {
          map.current.resize(); // Ensure proper sizing
          setIsMapReady(true);
          onMapLoad?.(map.current);
        }
      });

      map.current.on('error', (e) => {
        console.warn('Map error, attempting fallback:', e);
        if (map.current) {
          map.current.setStyle(getFallbackStyle());
        }
      });

      if (onMapMove) {
        map.current.on('move', onMapMove);
      }

      if (onMapRotate) {
        map.current.on('rotate', onMapRotate);
      }

    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  }, [options, getMapStyle, getFallbackStyle, onMapLoad, onMapMove, onMapRotate]);

  // Setup resize observer for responsive behavior
  useEffect(() => {
    if (!mapContainer.current) return;

    resizeObserver.current = new ResizeObserver(() => {
      if (map.current && isMapReady) {
        map.current.resize();
      }
    });

    resizeObserver.current.observe(mapContainer.current);

    return () => {
      resizeObserver.current?.disconnect();
    };
  }, [isMapReady]);

  // Initialize map when container is ready
  useEffect(() => {
    if (mapContainer.current) {
      initializeMap();
    }

    return () => {
      map.current?.remove();
      map.current = null;
      setIsMapReady(false);
    };
  }, [initializeMap]);

  // Public API for getting map instance
  const getMap = useCallback(() => map.current, []);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
      {isMapReady && children && (
        <div className="absolute inset-0 pointer-events-none">
          {React.Children.map(children, child =>
            React.isValidElement(child)
              ? React.cloneElement(child, { map: getMap() } as any)
              : child
          )}
        </div>
      )}
    </div>
  );
};

export default MapCore;
export { maplibregl };