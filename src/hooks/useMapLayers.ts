import { useState, useCallback, useEffect } from 'react';
import { useMapInstance } from './useMapInstance';
import { useNDVILayer } from './useNDVILayer';
import mapboxgl from 'mapbox-gl';
import { logger } from '@/lib/logger';

// Layer types with comprehensive configuration
export interface LayerConfig {
  id: string;
  name: string;
  type: 'satellite' | 'ndvi' | 'weather' | 'soil' | 'zones' | 'pest-risk' | 'irrigation' | 'growth-stage';
  enabled: boolean;
  opacity: number;
  zIndex: number;
  premium?: boolean;
  category: 'base' | 'agriculture' | 'weather' | 'analysis';
  icon: string;
  description: string;
  legend?: LegendConfig;
  apiConfig?: {
    endpoint: string;
    params?: Record<string, any>;
  };
}

export interface LegendConfig {
  type: 'gradient' | 'discrete' | 'numeric';
  colorMap: Array<{
    value: number | string;
    color: string;
    label: string;
  }>;
  unit?: string;
  min?: number;
  max?: number;
}

// Predefined layer presets inspired by FieldView
export interface LayerPreset {
  id: string;
  name: string;
  description: string;
  layers: string[];
  category: 'base' | 'analysis' | 'agriculture' | 'weather';
  icon: string;
}

export const DEFAULT_LAYERS: LayerConfig[] = [
  {
    id: 'satellite',
    name: 'Satélite',
    type: 'satellite',
    enabled: true,
    opacity: 100,
    zIndex: 1,
    category: 'base',
    icon: 'Satellite',
    description: 'Imagens de satélite em alta resolução'
  },
  {
    id: 'ndvi',
    name: 'NDVI',
    type: 'ndvi',
    enabled: false,
    opacity: 75,
    zIndex: 10,
    premium: true,
    category: 'agriculture',
    icon: 'Leaf',
    description: 'Índice de vegetação normalizada',
    legend: {
      type: 'gradient',
      colorMap: [
        { value: -1, color: 'hsl(0, 70%, 50%)', label: 'Solo nu' },
        { value: 0, color: 'hsl(30, 70%, 50%)', label: 'Vegetação esparsa' },
        { value: 0.5, color: 'hsl(60, 70%, 50%)', label: 'Vegetação moderada' },
        { value: 1, color: 'hsl(120, 70%, 40%)', label: 'Vegetação densa' }
      ],
      unit: 'NDVI',
      min: -1,
      max: 1
    }
  },
  {
    id: 'weather',
    name: 'Clima',
    type: 'weather',
    enabled: false,
    opacity: 60,
    zIndex: 8,
    premium: true,
    category: 'weather',
    icon: 'CloudRain',
    description: 'Dados meteorológicos em tempo real'
  },
  {
    id: 'soil',
    name: 'Solo',
    type: 'soil',
    enabled: false,
    opacity: 70,
    zIndex: 5,
    premium: true,
    category: 'agriculture',
    icon: 'Mountain',
    description: 'Análise de tipos e qualidade do solo'
  },
  {
    id: 'zones',
    name: 'Zonas de Manejo',
    type: 'zones',
    enabled: false,
    opacity: 80,
    zIndex: 15,
    premium: true,
    category: 'analysis',
    icon: 'Zap',
    description: 'Divisão por zonas de produtividade'
  },
  {
    id: 'pest-risk',
    name: 'Risco de Pragas',
    type: 'pest-risk',
    enabled: false,
    opacity: 65,
    zIndex: 12,
    premium: true,
    category: 'analysis',
    icon: 'Bug',
    description: 'Análise preditiva de riscos fitossanitários'
  },
  {
    id: 'irrigation',
    name: 'Irrigação',
    type: 'irrigation',
    enabled: false,
    opacity: 85,
    zIndex: 6,
    premium: true,
    category: 'agriculture',
    icon: 'Droplets',
    description: 'Sistema e necessidades de irrigação'
  },
  {
    id: 'growth-stage',
    name: 'Estágio Fenológico',
    type: 'growth-stage',
    enabled: false,
    opacity: 75,
    zIndex: 11,
    premium: true,
    category: 'analysis',
    icon: 'Sprout',
    description: 'Desenvolvimento das culturas'
  }
];

export const LAYER_PRESETS: LayerPreset[] = [
  {
    id: 'base',
    name: 'Base',
    description: 'Visualização básica com satélite',
    layers: ['satellite'],
    category: 'base',
    icon: 'Map'
  },
  {
    id: 'vegetation-analysis',
    name: 'Análise de Vegetação',
    description: 'NDVI + Zonas + Clima para análise vegetal',
    layers: ['satellite', 'ndvi', 'zones', 'weather'],
    category: 'analysis',
    icon: 'Leaf'
  },
  {
    id: 'field-monitoring',
    name: 'Monitoramento',
    description: 'Acompanhamento completo da lavoura',
    layers: ['satellite', 'pest-risk', 'irrigation', 'growth-stage'],
    category: 'analysis',
    icon: 'Eye'
  },
  {
    id: 'planting-season',
    name: 'Plantio',
    description: 'Preparação e planejamento do plantio',
    layers: ['satellite', 'soil', 'weather', 'zones'],
    category: 'agriculture',
    icon: 'Sprout'
  },
  {
    id: 'harvest-ready',
    name: 'Colheita',
    description: 'Avaliação para decisão de colheita',
    layers: ['satellite', 'ndvi', 'growth-stage', 'weather'],
    category: 'agriculture',
    icon: 'Wheat'
  }
];

export const useMapLayers = () => {
  const { map, isReady } = useMapInstance();
  const ndviLayer = useNDVILayer();
  
  const [layers, setLayers] = useState<LayerConfig[]>(DEFAULT_LAYERS);
  const [activePreset, setActivePreset] = useState<string | null>('base');
  const [customFavorites, setCustomFavorites] = useState<LayerPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toggle layer visibility
  const toggleLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, enabled: !layer.enabled }
        : layer
    ));
    
    // Clear active preset when manually toggling layers
    setActivePreset(null);
  }, []);

  // Update layer opacity
  const updateOpacity = useCallback((layerId: string, opacity: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, opacity }
        : layer
    ));
  }, []);

  // Apply layer preset
  const applyPreset = useCallback((presetId: string) => {
    const preset = [...LAYER_PRESETS, ...customFavorites].find(p => p.id === presetId);
    if (!preset) return;

    setLayers(prev => prev.map(layer => ({
      ...layer,
      enabled: preset.layers.includes(layer.id)
    })));
    
    setActivePreset(presetId);
  }, [customFavorites]);

  // Save custom favorite
  const saveFavorite = useCallback((name: string, description: string) => {
    const enabledLayers = layers.filter(l => l.enabled).map(l => l.id);
    if (enabledLayers.length === 0) return;

    const newFavorite: LayerPreset = {
      id: `custom-${Date.now()}`,
      name,
      description,
      layers: enabledLayers,
      category: 'analysis',
      icon: 'Star'
    };

    setCustomFavorites(prev => [...prev, newFavorite]);
    setActivePreset(newFavorite.id);
  }, [layers]);

  // Remove custom favorite
  const removeFavorite = useCallback((favoriteId: string) => {
    setCustomFavorites(prev => prev.filter(f => f.id !== favoriteId));
    if (activePreset === favoriteId) {
      setActivePreset(null);
    }
  }, [activePreset]);

  // Load layer data from APIs
  const loadLayerData = useCallback(async (layerId: string) => {
    if (!map || !isReady) return;

    const layer = layers.find(l => l.id === layerId);
    if (!layer || !layer.enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      switch (layer.type) {
        case 'ndvi':
          // Use existing NDVI layer hook
          await ndviLayer.loadNDVIData();
          break;
          
        case 'weather':
          await loadWeatherData(layer);
          break;
          
        case 'soil':
          await loadSoilData(layer);
          break;
          
        case 'zones':
          await loadZoneData(layer);
          break;
          
        case 'pest-risk':
          await loadPestRiskData(layer);
          break;
          
        case 'irrigation':
          await loadIrrigationData(layer);
          break;
          
        case 'growth-stage':
          await loadGrowthStageData(layer);
          break;
          
        default:
          logger.warn('Layer type not implemented', { layerType: layer.type });
      }
      
      setIsLoading(false);
    } catch (err) {
      logger.error('Error loading layer', { layerId, error: err });
      setError(err instanceof Error ? err.message : `Erro ao carregar camada ${layer.name}`);
      setIsLoading(false);
    }
  }, [map, isReady, layers, ndviLayer]);

  // Sync with mapbox layers when configuration changes
  useEffect(() => {
    if (!map || !isReady) return;

    layers.forEach(layer => {
      if (layer.enabled) {
        loadLayerData(layer.id);
      } else {
        // Remove layer from map if disabled
        try {
          if (map.getLayer(`${layer.id}-layer`)) {
            map.removeLayer(`${layer.id}-layer`);
          }
          if (map.getSource(`${layer.id}-source`)) {
            map.removeSource(`${layer.id}-source`);
          }
        } catch (e) {
          // Layer might not exist
        }
      }
    });
  }, [layers, map, isReady, loadLayerData]);

  // Get layers by category
  const getLayersByCategory = useCallback((category: LayerConfig['category']) => {
    return layers.filter(layer => layer.category === category);
  }, [layers]);

  // Get enabled layers sorted by z-index
  const getEnabledLayers = useCallback(() => {
    return layers.filter(layer => layer.enabled).sort((a, b) => a.zIndex - b.zIndex);
  }, [layers]);

  // Get legend for enabled layers
  const getActiveLegends = useCallback(() => {
    return layers.filter(layer => layer.enabled && layer.legend).map(layer => ({
      layerId: layer.id,
      layerName: layer.name,
      legend: layer.legend!
    }));
  }, [layers]);

  return {
    layers,
    activePreset,
    customFavorites,
    isLoading,
    error,
    toggleLayer,
    updateOpacity,
    applyPreset,
    saveFavorite,
    removeFavorite,
    loadLayerData,
    getLayersByCategory,
    getEnabledLayers,
    getActiveLegends,
    // Layer presets
    presets: LAYER_PRESETS
  };
};

// Helper functions for loading different layer types
async function loadWeatherData(layer: LayerConfig) {
  // Mock implementation - replace with real weather API
  logger.debug('Loading weather data for layer', { layerId: layer.id });
}

async function loadSoilData(layer: LayerConfig) {
  // Mock implementation - replace with real soil API
  logger.debug('Loading soil data for layer', { layerId: layer.id });
}

async function loadZoneData(layer: LayerConfig) {
  // Mock implementation - replace with real zone API
  logger.debug('Loading zone data for layer', { layerId: layer.id });
}

async function loadPestRiskData(layer: LayerConfig) {
  // Mock implementation - replace with real pest risk API
  logger.debug('Loading pest risk data for layer', { layerId: layer.id });
}

async function loadIrrigationData(layer: LayerConfig) {
  // Mock implementation - replace with real irrigation API
  logger.debug('Loading irrigation data for layer', { layerId: layer.id });
}

async function loadGrowthStageData(layer: LayerConfig) {
  // Mock implementation - replace with real growth stage API
  logger.debug('Loading growth stage data for layer', { layerId: layer.id });
}