import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface MapCoreOptions {
  center?: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
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
  center: [-47.8919, -15.7975], // Brasília
  zoom: 10,
  bearing: 0,
  pitch: 0,
  maxZoom: 22,
  minZoom: 1
};

// Simplified OpenStreetMap style - 100% reliable
const RELIABLE_MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'osm': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [{
    id: 'osm',
    type: 'raster',
    source: 'osm'
  }]
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
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitializing = useRef(false);

  // Safe cleanup
  const cleanupMap = useCallback(() => {
    console.log('🧹 Cleaning up map');
    
    if (map.current) {
      try {
        // Remove all event listeners safely
        const mapInstance = map.current;
        
        // Check if map is still valid before cleanup
        if (mapInstance.getContainer?.()) {
          mapInstance.remove();
        }
      } catch (error) {
        console.warn('⚠️ Map cleanup warning:', error);
        // Force cleanup container
        if (mapContainer.current) {
          mapContainer.current.innerHTML = '';
        }
      } finally {
        map.current = null;
        setIsMapReady(false);
        isInitializing.current = false;
      }
    }
  }, []);

  // Simplified synchronous initialization
  const initializeMap = useCallback(() => {
    if (isInitializing.current || !mapContainer.current || map.current) {
      return;
    }

    isInitializing.current = true;
    console.log('🗺️ Initializing reliable map');

    try {
      setError(null);
      
      const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: RELIABLE_MAP_STYLE,
        center: mergedOptions.center,
        zoom: mergedOptions.zoom,
        bearing: mergedOptions.bearing,
        pitch: mergedOptions.pitch,
        maxZoom: mergedOptions.maxZoom,
        minZoom: mergedOptions.minZoom,
        attributionControl: false
      });

      // Error handling
      map.current.on('error', (e) => {
        console.error('🔥 Map error:', e);
        setError(`Map error: ${e.error?.message || 'Unknown error'}`);
      });

      // Load handler
      map.current.on('load', () => {
        console.log('✅ Map loaded successfully');
        if (map.current) {
          setIsMapReady(true);
          onMapLoad?.(map.current);
        }
      });

      // Event listeners
      if (onMapMove) {
        map.current.on('move', onMapMove);
      }

      if (onMapRotate) {
        map.current.on('rotate', onMapRotate);
      }

      console.log('✅ Map initialization complete');

    } catch (error) {
      console.error('❌ Map initialization failed:', error);
      setError(`Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`);
      isInitializing.current = false;
    }
  }, [options, onMapLoad, onMapMove, onMapRotate]);

  // Initialize map
  useEffect(() => {
    if (mapContainer.current && !isInitializing.current) {
      const timer = setTimeout(initializeMap, 50);
      return () => clearTimeout(timer);
    }
  }, [initializeMap]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanupMap;
  }, [cleanupMap]);

  const getMap = useCallback(() => map.current, []);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainer} 
        className="absolute inset-0 w-full h-full"
      />
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="bg-card p-4 rounded-lg shadow-lg border max-w-sm mx-4">
            <h3 className="font-semibold text-destructive mb-2">Erro no Mapa</h3>
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            <button
              onClick={() => {
                setError(null);
                cleanupMap();
                setTimeout(initializeMap, 200);
              }}
              className="w-full bg-primary text-primary-foreground px-3 py-2 rounded text-sm hover:bg-primary/90 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      )}

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && isMapReady && map.current && (
        <div className="absolute top-2 left-2 bg-black/80 text-white text-xs p-2 rounded font-mono z-20">
          <div>Status: Ready</div>
          <div>Center: {map.current.getCenter()?.lng?.toFixed(4)}, {map.current.getCenter()?.lat?.toFixed(4)}</div>
          <div>Zoom: {map.current.getZoom()?.toFixed(2)}</div>
        </div>
      )}
      
      {/* Children */}
      {isMapReady && children && (
        <div className="absolute inset-0 pointer-events-none z-5">
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