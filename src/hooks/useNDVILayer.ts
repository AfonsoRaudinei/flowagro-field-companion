import { useState, useCallback, useEffect } from 'react';
import { useMapInstance } from './useMapInstance';
import mapboxgl from 'mapbox-gl';
import { logger } from '@/lib/logger';

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

  // Load real NDVI data from satellite APIs
  const loadNDVIData = useCallback(async () => {
    if (!map || !isReady) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get current map bounds for API call
      const bounds = map.getBounds();
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(), 
        bounds.getEast(),
        bounds.getNorth()
      ];

      logger.debug('Loading NDVI data', { 
        bbox, 
        dateRange: config.dateRange 
      });

      // Try Sentinel Hub API first (free tier available)
      let imageData;
      let apiUsed = 'sentinel-hub';
      
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const sentinelResponse = await supabase.functions.invoke('sentinel-hub', {
          body: {
            bbox,
            date: config.dateRange.end, // Use end date for most recent data
            layerType: 'ndvi',
            width: 512,
            height: 512
          }
        });

        if (sentinelResponse.error) {
          throw new Error(sentinelResponse.error.message);
        }

        imageData = sentinelResponse.data;
        logger.info('NDVI data loaded from Sentinel Hub');
        
      } catch (sentinelError) {
        logger.warn('Sentinel Hub failed, trying Planet Labs', { error: sentinelError });
        
        // Fallback to Planet Labs API
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const planetResponse = await supabase.functions.invoke('planet-labs', {
            body: {
              bbox,
              date: config.dateRange.end,
              layerType: 'ndvi',
              cloudCover: 0.2
            }
          });

          if (planetResponse.error) {
            throw new Error(planetResponse.error.message);
          }

          imageData = planetResponse.data;
          apiUsed = 'planet-labs';
          logger.info('NDVI data loaded from Planet Labs');
          
        } catch (planetError) {
          logger.error('Both NDVI APIs failed', { planetError });
          throw new Error('Falha ao carregar dados NDVI de ambas as APIs');
        }
      }

      // If we got image data from Sentinel Hub (ArrayBuffer), convert to raster layer
      if (imageData instanceof ArrayBuffer || (typeof imageData === 'object' && imageData.downloadUrl)) {
        
        // For now, create a sample visualization while real image processing is implemented
        const sampleNDVISource = {
          type: 'geojson' as const,
          data: {
            type: 'FeatureCollection' as const,
            features: [
              {
                type: 'Feature' as const,
                properties: {
                  ndvi: 0.8,
                  color: getColorForNDVI(0.8, config.colorScale),
                  api: apiUsed,
                  date: config.dateRange.end
                },
                geometry: {
                  type: 'Polygon' as const,
                  coordinates: [[
                    [bbox[0], bbox[1]],
                    [bbox[2], bbox[1]],
                    [bbox[2], bbox[3]],
                    [bbox[0], bbox[3]],
                    [bbox[0], bbox[1]]
                  ]]
                }
              }
            ]
          }
        };

        // Add source if it doesn't exist
        if (!map.getSource('ndvi-data')) {
          map.addSource('ndvi-data', sampleNDVISource);
        } else {
          // Update existing source
          (map.getSource('ndvi-data') as mapboxgl.GeoJSONSource).setData(sampleNDVISource.data);
        }

        // Add layer if it doesn't exist
        if (!map.getLayer('ndvi-layer')) {
          map.addLayer({
            id: 'ndvi-layer',
            type: 'fill',
            source: 'ndvi-data',
            paint: {
              'fill-color': getColorRampExpression(config.colorScale),
              'fill-opacity': config.opacity
            }
          });
        }
      }

      setIsLoading(false);
    } catch (err) {
      logger.error('NDVI loading error', { error: err });
      setError(err instanceof Error ? err.message : 'Falha ao carregar dados NDVI');
      setIsLoading(false);
    }
  }, [map, isReady, config]);

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
      if (map && map.getCanvas && map.getStyle) {
        try {
          if (map.getLayer('ndvi-layer')) {
            map.removeLayer('ndvi-layer');
          }
          if (map.getSource('ndvi-data')) {
            map.removeSource('ndvi-data');
          }
        } catch (error) {
          logger.warn('Error cleaning up NDVI layer', { error });
        }
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

// Helper function to get color for NDVI value based on color scale
function getColorForNDVI(ndvi: number, colorScale: string): string {
  // Normalize NDVI from [-1, 1] to [0, 1]
  const normalized = (ndvi + 1) / 2;
  
  switch (colorScale) {
    case 'viridis':
      return `hsl(${280 - normalized * 100}, 70%, ${30 + normalized * 40}%)`;
    case 'plasma':
      return `hsl(${300 - normalized * 60}, 90%, ${20 + normalized * 60}%)`;
    case 'inferno':
      return `hsl(${60 - normalized * 60}, 100%, ${10 + normalized * 70}%)`;
    case 'magma':
      return `hsl(${320 - normalized * 40}, 80%, ${15 + normalized * 65}%)`;
    default:
      return `hsl(${120 * normalized}, 70%, 50%)`;
  }
}

// Helper function to create Mapbox color ramp expression
function getColorRampExpression(colorScale: string): mapboxgl.Expression {
  // Simple color based on NDVI property
  return [
    'case',
    ['>=', ['get', 'ndvi'], 0.8], getColorForNDVI(0.9, colorScale),
    ['>=', ['get', 'ndvi'], 0.6], getColorForNDVI(0.7, colorScale),
    ['>=', ['get', 'ndvi'], 0.4], getColorForNDVI(0.5, colorScale),
    ['>=', ['get', 'ndvi'], 0.2], getColorForNDVI(0.3, colorScale),
    ['>=', ['get', 'ndvi'], 0.0], getColorForNDVI(0.1, colorScale),
    getColorForNDVI(-0.5, colorScale) // Default
  ] as any;
}