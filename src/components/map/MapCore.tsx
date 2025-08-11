
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
  center: [-47.8919, -15.7975], // Brasília [longitude, latitude] - FIXED!
  zoom: 10,
  bearing: 0,
  pitch: 0,
  maxZoom: 22,
  minZoom: 1
};

// iOS-optimized map container styles
const MAP_CONTAINER_STYLES = {
  position: 'absolute' as const,
  inset: 0,
  // iOS performance optimizations
  transform: 'translateZ(0)', // Force hardware acceleration
  backfaceVisibility: 'hidden' as const,
  perspective: 1000,
  // Smooth touch handling
  touchAction: 'pan-x pan-y',
  WebkitOverflowScrolling: 'touch' as const,
  // Anti-aliasing
  WebkitFontSmoothing: 'antialiased' as const,
  MozOsxFontSmoothing: 'grayscale' as const
};

class TileSourceManager {
  private static retryCount = 0;
  private static maxRetries = 3;
  private static retryDelay = 1000;

  static async getOptimalTileSource(): Promise<maplibregl.StyleSpecification> {
    const sources = [
      // Primary: Stamen (reliable and fast)
      {
        name: 'stamen-satellite',
        tiles: ['https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.jpg'],
        attribution: '© Stadia Maps © Stamen Design'
      },
      // Secondary: OpenStreetMap (always available)
      {
        name: 'osm-standard',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        attribution: '© OpenStreetMap contributors'
      },
      // Emergency: Local fallback pattern
      {
        name: 'emergency-pattern',
        tiles: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDMyIDAgTCAwIDAgMCAzMiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZGRkIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4='],
        attribution: 'Emergency Offline View'
      }
    ];

    for (const source of sources) {
      try {
        await this.testTileSource(source.tiles[0]);
        return this.createStyleSpec(source);
      } catch (error) {
        console.warn(`Tile source ${source.name} failed, trying next...`);
        continue;
      }
    }

    // Ultimate fallback - solid color
    return this.createEmergencyStyle();
  }

  private static async testTileSource(tileUrl: string): Promise<void> {
    if (tileUrl.startsWith('data:')) {
      return Promise.resolve(); // Skip test for data URLs
    }

    return new Promise((resolve, reject) => {
      const testTile = tileUrl.replace('{z}', '10').replace('{x}', '512').replace('{y}', '512');
      const img = new Image();
      
      const timeout = setTimeout(() => {
        reject(new Error('Tile load timeout'));
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        resolve();
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Tile load failed'));
      };

      img.src = testTile;
    });
  }

  private static createStyleSpec(source: any): maplibregl.StyleSpecification {
    return {
      version: 8 as const,
      sources: {
        'primary-tiles': {
          type: 'raster',
          tiles: source.tiles,
          tileSize: 256,
          attribution: source.attribution
        }
      },
      layers: [{
        id: 'primary-tiles',
        type: 'raster',
        source: 'primary-tiles',
        paint: {
          'raster-fade-duration': 300
        }
      }]
    };
  }

  private static createEmergencyStyle(): maplibregl.StyleSpecification {
    return {
      version: 8 as const,
      sources: {},
      layers: [{
        id: 'emergency-background',
        type: 'background',
        paint: {
          'background-color': '#f8f9fa'
        }
      }]
    };
  }

  static async retryWithBackoff<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
        console.log(`Retrying in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryWithBackoff(fn);
      }
      throw error;
    }
  }
}

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
  const [mapError, setMapError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const initializeMap = useCallback(async () => {
    if (!mapContainer.current || map.current) return;

    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    
    try {
      console.log('🗺️ Initializing map with coordinates:', mergedOptions.center);
      
      // Get optimal tile source with fallback
      const style = await TileSourceManager.retryWithBackoff(() => 
        TileSourceManager.getOptimalTileSource()
      );

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style,
        center: mergedOptions.center,
        zoom: mergedOptions.zoom,
        bearing: mergedOptions.bearing,
        pitch: mergedOptions.pitch,
        maxZoom: mergedOptions.maxZoom,
        minZoom: mergedOptions.minZoom,
        // iOS optimizations
        attributionControl: false, // Custom attribution
        logoPosition: 'bottom-right'
      });

      // Enhanced error handling
      map.current.on('error', async (e) => {
        console.error('🔥 Map error:', e);
        setMapError(`Map error: ${e.error?.message || 'Unknown error'}`);
        
        // Attempt automatic recovery
        try {
          const fallbackStyle = await TileSourceManager.getOptimalTileSource();
          map.current?.setStyle(fallbackStyle);
          setMapError(null);
          console.log('✅ Map recovered successfully');
        } catch (recoveryError) {
          console.error('❌ Map recovery failed:', recoveryError);
        }
      });

      // Success handlers
      map.current.on('load', () => {
        console.log('✅ Map loaded successfully');
        if (map.current) {
          map.current.resize();
          setIsMapReady(true);
          setMapError(null);
          
          // Debug info
          setDebugInfo({
            center: map.current.getCenter(),
            zoom: map.current.getZoom(),
            bearing: map.current.getBearing(),
            pitch: map.current.getPitch()
          });
          
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

      // iOS-specific touch optimizations
      map.current.on('touchstart', () => {
        if (mapContainer.current) {
          mapContainer.current.style.pointerEvents = 'auto';
        }
      });

    } catch (error) {
      console.error('❌ Failed to initialize map:', error);
      setMapError(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [options, onMapLoad, onMapMove, onMapRotate]);

  // Setup resize observer with debouncing
  useEffect(() => {
    if (!mapContainer.current) return;

    let resizeTimeout: NodeJS.Timeout;
    
    resizeObserver.current = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (map.current && isMapReady) {
          map.current.resize();
        }
      }, 100); // Debounce resize calls
    });

    resizeObserver.current.observe(mapContainer.current);

    return () => {
      resizeObserver.current?.disconnect();
      clearTimeout(resizeTimeout);
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

  // Public API
  const getMap = useCallback(() => map.current, []);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainer} 
        style={MAP_CONTAINER_STYLES}
        className="maplibre-map-container"
      />
      
      {/* Error overlay */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="bg-card p-4 rounded-lg shadow-lg border max-w-sm mx-4">
            <h3 className="font-semibold text-destructive mb-2">Erro no Mapa</h3>
            <p className="text-sm text-muted-foreground mb-3">{mapError}</p>
            <button
              onClick={() => {
                setMapError(null);
                initializeMap();
              }}
              className="w-full bg-primary text-primary-foreground px-3 py-2 rounded text-sm hover:bg-primary/90 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div className="absolute top-2 left-2 bg-black/80 text-white text-xs p-2 rounded font-mono z-20">
          <div>Center: {debugInfo.center?.lng?.toFixed(4)}, {debugInfo.center?.lat?.toFixed(4)}</div>
          <div>Zoom: {debugInfo.zoom?.toFixed(2)}</div>
          <div>Bearing: {debugInfo.bearing?.toFixed(1)}°</div>
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
