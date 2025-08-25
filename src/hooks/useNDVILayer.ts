import { useState, useCallback, useEffect } from 'react';
import { useMapInstance } from './useMapInstance';
import mapboxgl from 'mapbox-gl';

export interface NDVILayerConfig {
  opacity: number;
  visible: boolean;
  colorScale: 'viridis' | 'plasma' | 'inferno' | 'magma';
  dateRange: {
    start: string;
    end: string;
  };
}

export const useNDVILayer = () => {
  const { map, isReady } = useMapInstance();
  const [config, setConfig] = useState<NDVILayerConfig>({
    opacity: 0.7,
    visible: false,
    colorScale: 'viridis',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toggle NDVI layer visibility
  const toggleVisibility = useCallback(() => {
    setConfig(prev => ({ ...prev, visible: !prev.visible }));
  }, []);

  // Update opacity
  const setOpacity = useCallback((opacity: number) => {
    setConfig(prev => ({ ...prev, opacity }));
  }, []);

  // Update color scale
  const setColorScale = useCallback((colorScale: NDVILayerConfig['colorScale']) => {
    setConfig(prev => ({ ...prev, colorScale }));
  }, []);

  // Update date range
  const setDateRange = useCallback((dateRange: NDVILayerConfig['dateRange']) => {
    setConfig(prev => ({ ...prev, dateRange }));
  }, []);

  // Load NDVI data (placeholder for real implementation)
  const loadNDVIData = useCallback(async () => {
    if (!map || !isReady) return;

    setIsLoading(true);
    setError(null);

    try {
      // This is a placeholder - in real implementation, this would:
      // 1. Call Sentinel-2 or other satellite API
      // 2. Process NDVI data
      // 3. Add raster layer to map
      
      // For now, we'll add a sample GeoJSON layer as demonstration
      const sampleNDVISource = {
        type: 'geojson' as const,
        data: {
          type: 'FeatureCollection' as const,
          features: [
            {
              type: 'Feature' as const,
              properties: {
                ndvi: 0.8,
                color: '#00ff00'
              },
              geometry: {
                type: 'Polygon' as const,
                coordinates: [[
                  [-47.9, -15.8],
                  [-47.8, -15.8],
                  [-47.8, -15.7],
                  [-47.9, -15.7],
                  [-47.9, -15.8]
                ]]
              }
            }
          ]
        }
      };

      // Add source if it doesn't exist
      if (!map.getSource('ndvi-data')) {
        map.addSource('ndvi-data', sampleNDVISource);
      }

      // Add layer if it doesn't exist
      if (!map.getLayer('ndvi-layer')) {
        map.addLayer({
          id: 'ndvi-layer',
          type: 'fill',
          source: 'ndvi-data',
          paint: {
            'fill-color': [
              'case',
              ['>', ['get', 'ndvi'], 0.7], '#00ff00',
              ['>', ['get', 'ndvi'], 0.5], '#ffff00',
              ['>', ['get', 'ndvi'], 0.3], '#ff8800',
              '#ff0000'
            ],
            'fill-opacity': config.opacity
          }
        });
      }

      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load NDVI data');
      setIsLoading(false);
    }
  }, [map, isReady, config.opacity]);

  // Update layer properties when config changes
  useEffect(() => {
    if (!map || !isReady) return;

    const layer = map.getLayer('ndvi-layer');
    if (layer) {
      // Update opacity
      map.setPaintProperty('ndvi-layer', 'fill-opacity', config.visible ? config.opacity : 0);
    } else if (config.visible) {
      // Load data if layer doesn't exist but should be visible
      loadNDVIData();
    }
  }, [map, isReady, config, loadNDVIData]);

  // Remove layer when component unmounts
  useEffect(() => {
    return () => {
      if (map && map.getLayer('ndvi-layer')) {
        map.removeLayer('ndvi-layer');
        map.removeSource('ndvi-data');
      }
    };
  }, [map]);

  return {
    config,
    isLoading,
    error,
    toggleVisibility,
    setOpacity,
    setColorScale,
    setDateRange,
    loadNDVIData
  };
};