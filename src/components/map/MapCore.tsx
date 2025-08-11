
import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface MapCoreOptions {
  center?: [number, number]; // [longitude, latitude]
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
  center: [-47.8919, -15.7975], // Brasília [longitude, latitude]
  zoom: 10,
  bearing: 0,
  pitch: 0,
  maxZoom: 22,
  minZoom: 1
};

// Simplified map container styles - removed problematic iOS optimizations
const MAP_CONTAINER_STYLES = {
  position: 'absolute' as const,
  inset: 0,
  width: '100%',
  height: '100%'
};

// Simple, reliable OpenStreetMap style - no async loading
const getReliableMapStyle = (): maplibregl.StyleSpecification => {
  console.log('🗺️ Using reliable OpenStreetMap style');
  return {
    version: 8 as const,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [{
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm-tiles',
      paint: {
        'raster-fade-duration': 0 // No fade for immediate loading
      }
    }]
  };
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
  const [mapError, setMapError] = useState<string | null>(null);
  const initializationRef = useRef<boolean>(false);

  // Cleanup function - safer cleanup
  const cleanupMap = useCallback(() => {
    console.log('🧹 Cleaning up map...');
    
    if (map.current) {
      try {
        // Remove event listeners first
        map.current.off();
        
        // Only remove if the map is properly initialized
        if (map.current.loaded && map.current.loaded()) {
          map.current.remove();
        } else {
          // Force cleanup for incomplete maps
          if (map.current._container) {
            map.current._container.innerHTML = '';
          }
        }
      } catch (error) {
        console.warn('⚠️ Map cleanup warning:', error);
        // Force cleanup the container
        if (mapContainer.current) {
          mapContainer.current.innerHTML = '';
        }
      } finally {
        map.current = null;
        setIsMapReady(false);
        initializationRef.current = false;
      }
    }
  }, []);

  // Simplified map initialization - synchronous, no async complexity
  const initializeMap = useCallback(() => {
    // Prevent multiple initializations
    if (initializationRef.current || !mapContainer.current || map.current) {
      return;
    }

    initializationRef.current = true;
    
    console.log('🗺️ Starting synchronous map initialization...');
    
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    
    try {
      setMapError(null);
      
      // Create map with reliable style
      const reliableStyle = getReliableMapStyle();
      
      console.log('🗺️ Creating MapLibre instance with center:', mergedOptions.center);
      
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: reliableStyle,
        center: mergedOptions.center,
        zoom: mergedOptions.zoom,
        bearing: mergedOptions.bearing,
        pitch: mergedOptions.pitch,
        maxZoom: mergedOptions.maxZoom,
        minZoom: mergedOptions.minZoom,
        attributionControl: false,
        logoPosition: 'bottom-right'
      });

      // Error handling - simplified
      map.current.on('error', (e) => {
        console.error('🔥 Map error:', e);
        setMapError(`Map error: ${e.error?.message || 'Unknown error'}`);
      });

      // Load handler - simplified
      map.current.on('load', () => {
        console.log('✅ Map loaded successfully');
        if (map.current) {
          setIsMapReady(true);
          setMapError(null);
          onMapLoad?.(map.current);
        }
      });

      // Event listeners
      if (onMapMove && map.current) {
        map.current.on('move', onMapMove);
      }

      if (onMapRotate && map.current) {
        map.current.on('rotate', onMapRotate);
      }

      console.log('✅ Map initialization completed');

    } catch (error) {
      console.error('❌ Failed to initialize map:', error);
      setMapError(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      initializationRef.current = false;
    }
  }, [options, onMapLoad, onMapMove, onMapRotate]);

  // Effect for initialization
  useEffect(() => {
    if (mapContainer.current && !initializationRef.current) {
      // Add small delay to ensure container is ready
      const initTimer = setTimeout(initializeMap, 100);
      return () => clearTimeout(initTimer);
    }
  }, [initializeMap]);

  // Effect for cleanup
  useEffect(() => {
    return () => {
      cleanupMap();
    };
  }, [cleanupMap]);

  // Public API
  const getMap = useCallback(() => map.current, []);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainer} 
        style={MAP_CONTAINER_STYLES}
        className="maplibre-map-container"
      />
      
      {/* Error overlay - simplified */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="bg-card p-4 rounded-lg shadow-lg border max-w-sm mx-4">
            <h3 className="font-semibold text-destructive mb-2">Erro no Mapa</h3>
            <p className="text-sm text-muted-foreground mb-3">{mapError}</p>
            <button
              onClick={() => {
                setMapError(null);
                cleanupMap();
                setTimeout(initializeMap, 500);
              }}
              className="w-full bg-primary text-primary-foreground px-3 py-2 rounded text-sm hover:bg-primary/90 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && isMapReady && map.current && (
        <div className="absolute top-2 left-2 bg-black/80 text-white text-xs p-2 rounded font-mono z-20">
          <div>Status: {isMapReady ? 'Ready' : 'Loading'}</div>
          <div>Center: {map.current.getCenter()?.lng?.toFixed(4)}, {map.current.getCenter()?.lat?.toFixed(4)}</div>
          <div>Zoom: {map.current.getZoom()?.toFixed(2)}</div>
        </div>
      )}
      
      {/* Children overlay */}
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
