import { useState, useCallback, useEffect } from 'react';
import { useMapInstance } from './useMapInstance';
import { MapPin } from './useMapPins';
import * as mapboxgl from 'mapbox-gl';
import { logger } from '@/lib/logger';

export type SmartMarkerCategory = 
  | 'irrigation' 
  | 'equipment' 
  | 'crop_health' 
  | 'weather' 
  | 'soil' 
  | 'pest_disease'
  | 'harvest'
  | 'planting'
  | 'maintenance'
  | 'observation';

export interface SmartMarkerData {
  // Core marker data
  id: string;
  coordinates: [number, number];
  title: string;
  description?: string;
  category: SmartMarkerCategory;
  
  // Smart features
  aiSuggested: boolean;
  confidence: number; // 0-1 for AI suggestions
  contextual: boolean; // Changes based on season/context
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  seasonRelevant?: string[]; // e.g., ['spring', 'summer']
  
  // Category-specific data
  metadata: {
    irrigation?: {
      flowRate?: number; // L/min
      coverage?: number; // radius in meters
      status: 'active' | 'inactive' | 'maintenance';
      lastInspection?: Date;
    };
    equipment?: {
      type: 'tractor' | 'harvester' | 'sprayer' | 'planter' | 'other';
      model?: string;
      status: 'operational' | 'maintenance' | 'breakdown';
      fuelLevel?: number; // percentage
      hoursUsed?: number;
    };
    cropHealth?: {
      severity: 'low' | 'medium' | 'high';
      symptoms: string[];
      affectedArea?: number; // square meters
      treatment?: string;
      followUpDate?: Date;
    };
    weather?: {
      stationId?: string;
      parameters: string[]; // ['temperature', 'humidity', 'rainfall']
      lastReading?: Date;
    };
    soil?: {
      ph?: number;
      moisture?: number; // percentage
      nutrients?: {
        nitrogen?: number;
        phosphorus?: number;
        potassium?: number;
      };
      testDate?: Date;
    };
    pestDisease?: {
      type: 'pest' | 'disease' | 'weed';
      species?: string;
      severity: 'low' | 'medium' | 'high';
      treatment?: string;
      sprayDate?: Date;
    };
  };
}

export interface MarkerCluster {
  id: string;
  center: [number, number];
  markers: SmartMarkerData[];
  radius: number; // in meters
  dominantCategory: SmartMarkerCategory;
}

export interface UseSmartMarkersReturn {
  // State
  markers: SmartMarkerData[];
  clusters: MarkerCluster[];
  isAnalyzing: boolean;
  
  // AI-powered actions
  suggestMarkers: (area: [number, number][], context?: string) => Promise<SmartMarkerData[]>;
  categorizeMarker: (coordinates: [number, number], description?: string) => Promise<SmartMarkerCategory>;
  
  // Marker management
  addSmartMarker: (marker: Omit<SmartMarkerData, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMarker: (id: string, updates: Partial<SmartMarkerData>) => void;
  removeMarker: (id: string) => void;
  
  // Clustering
  enableClustering: boolean;
  setEnableClustering: (enabled: boolean) => void;
  clusteringDistance: number;
  setClusteringDistance: (distance: number) => void;
  
  // Filtering
  activeCategories: Set<SmartMarkerCategory>;
  toggleCategory: (category: SmartMarkerCategory) => void;
  priorityFilter: SmartMarkerData['priority'][];
  setPriorityFilter: (priorities: SmartMarkerData['priority'][]) => void;
  contextualFilter: boolean;
  setContextualFilter: (enabled: boolean) => void;
  
  // Utilities
  getMarkersByCategory: (category: SmartMarkerCategory) => SmartMarkerData[];
  getCriticalMarkers: () => SmartMarkerData[];
  getSeasonalMarkers: (season?: string) => SmartMarkerData[];
  exportMarkers: () => void;
}

const CATEGORY_CONFIGS: Record<SmartMarkerCategory, {
  name: string;
  icon: string;
  color: string;
  defaultPriority: SmartMarkerData['priority'];
  seasonalRelevance?: string[];
}> = {
  irrigation: {
    name: 'Irrigação',
    icon: '💧',
    color: '#2196F3',
    defaultPriority: 'high',
    seasonalRelevance: ['summer', 'dry_season']
  },
  equipment: {
    name: 'Equipamentos',
    icon: '🚜',
    color: '#FF9800',
    defaultPriority: 'medium'
  },
  crop_health: {
    name: 'Saúde da Cultura',
    icon: '🌱',
    color: '#4CAF50',
    defaultPriority: 'high',
    seasonalRelevance: ['spring', 'summer']
  },
  weather: {
    name: 'Estação Meteorológica',
    icon: '🌤️',
    color: '#03A9F4',
    defaultPriority: 'medium'
  },
  soil: {
    name: 'Solo',
    icon: '🌍',
    color: '#8D6E63',
    defaultPriority: 'medium'
  },
  pest_disease: {
    name: 'Pragas & Doenças',
    icon: '🐛',
    color: '#F44336',
    defaultPriority: 'critical',
    seasonalRelevance: ['spring', 'summer']
  },
  harvest: {
    name: 'Colheita',
    icon: '🌾',
    color: '#FFB300',
    defaultPriority: 'high',
    seasonalRelevance: ['autumn', 'harvest_season']
  },
  planting: {
    name: 'Plantio',
    icon: '🌱',
    color: '#8BC34A',
    defaultPriority: 'high',
    seasonalRelevance: ['spring', 'planting_season']
  },
  maintenance: {
    name: 'Manutenção',
    icon: '🔧',
    color: '#9E9E9E',
    defaultPriority: 'medium'
  },
  observation: {
    name: 'Observação',
    icon: '👁️',
    color: '#673AB7',
    defaultPriority: 'low'
  }
};

export const useSmartMarkers = (): UseSmartMarkersReturn => {
  const { map, isReady } = useMapInstance();
  
  // State management
  const [markers, setMarkers] = useState<SmartMarkerData[]>([]);
  const [clusters, setClusters] = useState<MarkerCluster[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Clustering settings
  const [enableClustering, setEnableClustering] = useState(true);
  const [clusteringDistance, setClusteringDistance] = useState(100); // meters
  
  // Filtering settings
  const [activeCategories, setActiveCategories] = useState<Set<SmartMarkerCategory>>(
    new Set(Object.keys(CATEGORY_CONFIGS) as SmartMarkerCategory[])
  );
  const [priorityFilter, setPriorityFilter] = useState<SmartMarkerData['priority'][]>([
    'low', 'medium', 'high', 'critical'
  ]);
  const [contextualFilter, setContextualFilter] = useState(true);

  // AI-powered marker suggestion
  const suggestMarkers = useCallback(async (
    area: [number, number][], 
    context?: string
  ): Promise<SmartMarkerData[]> => {
    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI suggestions based on area and context
      const suggestions: SmartMarkerData[] = [];
      const centerPoint = area.reduce((acc, point) => [
        acc[0] + point[0] / area.length,
        acc[1] + point[1] / area.length
      ], [0, 0] as [number, number]);
      
      // Generate contextual suggestions
      const currentSeason = getCurrentSeason();
      const contextLower = context?.toLowerCase() || '';
      
      if (contextLower.includes('irrigation') || currentSeason === 'summer') {
        suggestions.push({
          id: `ai_irrigation_${Date.now()}`,
          coordinates: [
            centerPoint[0] + (Math.random() - 0.5) * 0.01,
            centerPoint[1] + (Math.random() - 0.5) * 0.01
          ],
          title: 'Sistema de Irrigação Sugerido',
          description: 'IA detectou área com potencial para irrigação baseado em dados de umidade do solo',
          category: 'irrigation',
          aiSuggested: true,
          confidence: 0.75 + Math.random() * 0.2,
          contextual: true,
          priority: 'high',
          createdAt: new Date(),
          updatedAt: new Date(),
          seasonRelevant: ['summer', 'dry_season'],
          metadata: {
            irrigation: {
              coverage: 50,
              status: 'inactive'
            }
          }
        });
      }
      
      if (contextLower.includes('health') || contextLower.includes('problem')) {
        suggestions.push({
          id: `ai_health_${Date.now()}`,
          coordinates: [
            centerPoint[0] + (Math.random() - 0.5) * 0.01,
            centerPoint[1] + (Math.random() - 0.5) * 0.01
          ],
          title: 'Área com Possível Estresse',
          description: 'Análise NDVI indica possível estresse na cultura nesta região',
          category: 'crop_health',
          aiSuggested: true,
          confidence: 0.6 + Math.random() * 0.3,
          contextual: true,
          priority: 'high',
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            cropHealth: {
              severity: 'medium',
              symptoms: ['Baixo NDVI', 'Coloração amarelada'],
              affectedArea: Math.random() * 1000 + 100
            }
          }
        });
      }
      
      return suggestions;
    } catch (error) {
      logger.error('Error generating marker suggestions', { error });
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // AI-powered marker categorization
  const categorizeMarker = useCallback(async (
    coordinates: [number, number], 
    description?: string
  ): Promise<SmartMarkerCategory> => {
    // Simulate AI categorization based on location and description
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const desc = description?.toLowerCase() || '';
    
    if (desc.includes('irrigação') || desc.includes('água') || desc.includes('sprinkler')) {
      return 'irrigation';
    }
    if (desc.includes('trator') || desc.includes('máquina') || desc.includes('equipamento')) {
      return 'equipment';
    }
    if (desc.includes('doença') || desc.includes('praga') || desc.includes('inseto')) {
      return 'pest_disease';
    }
    if (desc.includes('solo') || desc.includes('ph') || desc.includes('nutriente')) {
      return 'soil';
    }
    if (desc.includes('plantio') || desc.includes('semear') || desc.includes('semente')) {
      return 'planting';
    }
    if (desc.includes('colheita') || desc.includes('harvest') || desc.includes('grão')) {
      return 'harvest';
    }
    
    // Default to observation if no clear category
    return 'observation';
  }, []);

  // Marker management
  const addSmartMarker = useCallback((marker: Omit<SmartMarkerData, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMarker: SmartMarkerData = {
      ...marker,
      id: `smart_marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setMarkers(prev => [...prev, newMarker]);
  }, []);

  const updateMarker = useCallback((id: string, updates: Partial<SmartMarkerData>) => {
    setMarkers(prev => prev.map(marker => 
      marker.id === id 
        ? { ...marker, ...updates, updatedAt: new Date() }
        : marker
    ));
  }, []);

  const removeMarker = useCallback((id: string) => {
    setMarkers(prev => prev.filter(marker => marker.id !== id));
  }, []);

  // Filtering utilities
  const toggleCategory = useCallback((category: SmartMarkerCategory) => {
    setActiveCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const getMarkersByCategory = useCallback((category: SmartMarkerCategory) => {
    return markers.filter(marker => marker.category === category);
  }, [markers]);

  const getCriticalMarkers = useCallback(() => {
    return markers.filter(marker => marker.priority === 'critical');
  }, [markers]);

  const getCurrentSeason = (): string => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'autumn';
    if (month >= 5 && month <= 7) return 'winter';
    if (month >= 8 && month <= 10) return 'spring';
    return 'summer';
  };

  const getSeasonalMarkers = useCallback((season?: string) => {
    const currentSeason = season || getCurrentSeason();
    return markers.filter(marker => 
      !marker.seasonRelevant || marker.seasonRelevant.includes(currentSeason)
    );
  }, [markers]);

  // Clustering algorithm
  const updateClusters = useCallback(() => {
    if (!enableClustering) {
      setClusters([]);
      return;
    }

    const filteredMarkers = markers.filter(marker => 
      activeCategories.has(marker.category) &&
      priorityFilter.includes(marker.priority) &&
      (!contextualFilter || !marker.contextual || getSeasonalMarkers().includes(marker))
    );

    // Simple clustering algorithm
    const clusters: MarkerCluster[] = [];
    const processed = new Set<string>();

    for (const marker of filteredMarkers) {
      if (processed.has(marker.id)) continue;

      const cluster: MarkerCluster = {
        id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        center: marker.coordinates,
        markers: [marker],
        radius: clusteringDistance,
        dominantCategory: marker.category
      };

      processed.add(marker.id);

      // Find nearby markers
      for (const otherMarker of filteredMarkers) {
        if (processed.has(otherMarker.id)) continue;

        const distance = getDistance(marker.coordinates, otherMarker.coordinates);
        if (distance <= clusteringDistance) {
          cluster.markers.push(otherMarker);
          processed.add(otherMarker.id);
        }
      }

      // Update cluster center and dominant category
      if (cluster.markers.length > 1) {
        cluster.center = [
          cluster.markers.reduce((sum, m) => sum + m.coordinates[0], 0) / cluster.markers.length,
          cluster.markers.reduce((sum, m) => sum + m.coordinates[1], 0) / cluster.markers.length
        ];

        // Find dominant category
        const categoryCount = cluster.markers.reduce((acc, m) => {
          acc[m.category] = (acc[m.category] || 0) + 1;
          return acc;
        }, {} as Record<SmartMarkerCategory, number>);

        cluster.dominantCategory = Object.entries(categoryCount)
          .sort(([,a], [,b]) => b - a)[0][0] as SmartMarkerCategory;
      }

      clusters.push(cluster);
    }

    setClusters(clusters);
  }, [markers, enableClustering, clusteringDistance, activeCategories, priorityFilter, contextualFilter, getSeasonalMarkers]);

  // Helper function to calculate distance between two points
  const getDistance = (point1: [number, number], point2: [number, number]): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1[1] * Math.PI / 180;
    const φ2 = point2[1] * Math.PI / 180;
    const Δφ = (point2[1] - point1[1]) * Math.PI / 180;
    const Δλ = (point2[0] - point1[0]) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Export markers
  const exportMarkers = useCallback(() => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalMarkers: markers.length,
      categories: Object.keys(CATEGORY_CONFIGS),
      markers: markers.map(marker => ({
        ...marker,
        categoryConfig: CATEGORY_CONFIGS[marker.category]
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowagro_smart_markers_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [markers]);

  // Update clusters when relevant state changes
  useEffect(() => {
    updateClusters();
  }, [updateClusters]);

  // Render markers on map
  useEffect(() => {
    if (!map || !isReady) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.smart-marker');
    existingMarkers.forEach(marker => marker.remove());

    const markersToRender = enableClustering ? clusters : markers.filter(marker => 
      activeCategories.has(marker.category) &&
      priorityFilter.includes(marker.priority) &&
      (!contextualFilter || !marker.contextual || getSeasonalMarkers().includes(marker))
    );

    markersToRender.forEach((item) => {
      if ('markers' in item) {
        // Render cluster
        const cluster = item as MarkerCluster;
        const config = CATEGORY_CONFIGS[cluster.dominantCategory];
        
        const el = document.createElement('div');
        el.className = 'smart-marker cluster-marker';
        el.innerHTML = `
          <div style="
            width: ${Math.min(40 + cluster.markers.length * 2, 60)}px;
            height: ${Math.min(40 + cluster.markers.length * 2, 60)}px;
            background: ${config.color};
            border: 3px solid white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: white;
            font-weight: bold;
            position: relative;
            transition: all 0.2s ease;
          " class="cluster-element">
            ${cluster.markers.length}
            <div style="
              position: absolute;
              top: -5px;
              right: -5px;
              width: 16px;
              height: 16px;
              background: rgba(255,255,255,0.9);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
            ">${config.icon}</div>
          </div>
        `;

        const marker = new mapboxgl.Marker(el)
          .setLngLat(cluster.center)
          .addTo(map);

        // Add popup for cluster
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px; min-width: 150px;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px;">${config.name}</h4>
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${cluster.markers.length} marcadores nesta área
            </p>
            <div style="margin-top: 8px; font-size: 11px;">
              ${Array.from(new Set(cluster.markers.map(m => CATEGORY_CONFIGS[m.category].name)))
                .slice(0, 3).join(', ')}
            </div>
          </div>
        `);
        
        marker.setPopup(popup);
      } else {
        // Render individual marker
        const marker = item as SmartMarkerData;
        const config = CATEGORY_CONFIGS[marker.category];
        
        const el = document.createElement('div');
        el.className = 'smart-marker individual-marker';
        
        const priorityBorder = marker.priority === 'critical' ? '#FF0000' : 
                              marker.priority === 'high' ? '#FF9800' : 
                              marker.priority === 'medium' ? '#2196F3' : '#9E9E9E';
        
        el.innerHTML = `
          <div style="
            width: 32px;
            height: 32px;
            background: ${config.color};
            border: 3px solid ${priorityBorder};
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            position: relative;
            transition: all 0.2s ease;
            ${marker.aiSuggested ? 'animation: pulse 2s infinite;' : ''}
          " class="marker-element">
            ${config.icon}
            ${marker.aiSuggested ? '<div style="position: absolute; top: -3px; right: -3px; width: 12px; height: 12px; background: #FFD700; border-radius: 50%; border: 1px solid white;"></div>' : ''}
          </div>
        `;

        const mapMarker = new mapboxgl.Marker(el)
          .setLngLat(marker.coordinates)
          .addTo(map);

        // Add detailed popup
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 12px; min-width: 200px; max-width: 250px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="
                width: 20px; 
                height: 20px; 
                background: ${config.color};
                border: 2px solid ${priorityBorder};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
              ">${config.icon}</div>
              <div>
                <span style="font-size: 11px; color: #666; text-transform: uppercase;">
                  ${config.name}
                </span>
                <span style="
                  margin-left: 8px; 
                  padding: 2px 6px; 
                  background: ${priorityBorder}; 
                  color: white; 
                  border-radius: 10px; 
                  font-size: 9px;
                  text-transform: uppercase;
                ">${marker.priority}</span>
              </div>
            </div>
            <h4 style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0;">
              ${marker.title}
            </h4>
            ${marker.description ? `<p style="font-size: 12px; color: #666; margin: 0 0 8px 0; line-height: 1.4;">${marker.description}</p>` : ''}
            ${marker.aiSuggested ? `
              <div style="background: #FFF3CD; border: 1px solid #FFE066; padding: 4px 8px; border-radius: 4px; margin: 8px 0;">
                <span style="font-size: 10px; color: #856404;">
                  🤖 Sugestão da IA (${Math.round(marker.confidence * 100)}% confiança)
                </span>
              </div>
            ` : ''}
            <div style="font-size: 10px; color: #999; margin-top: 8px;">
              ${marker.coordinates[1].toFixed(6)}, ${marker.coordinates[0].toFixed(6)}
            </div>
          </div>
        `);
        
        mapMarker.setPopup(popup);
      }
    });

    // Add CSS animation for AI suggested markers
    if (!document.getElementById('smart-markers-styles')) {
      const style = document.createElement('style');
      style.id = 'smart-markers-styles';
      style.textContent = `
        @keyframes pulse {
          0% { box-shadow: 0 4px 12px rgba(0,0,0,0.25), 0 0 0 0 rgba(255, 215, 0, 0.7); }
          70% { box-shadow: 0 4px 12px rgba(0,0,0,0.25), 0 0 0 10px rgba(255, 215, 0, 0); }
          100% { box-shadow: 0 4px 12px rgba(0,0,0,0.25), 0 0 0 0 rgba(255, 215, 0, 0); }
        }
      `;
      document.head.appendChild(style);
    }

  }, [map, isReady, markers, clusters, enableClustering, activeCategories, priorityFilter, contextualFilter, getSeasonalMarkers]);

  return {
    markers,
    clusters,
    isAnalyzing,
    suggestMarkers,
    categorizeMarker,
    addSmartMarker,
    updateMarker,
    removeMarker,
    enableClustering,
    setEnableClustering,
    clusteringDistance,
    setClusteringDistance,
    activeCategories,
    toggleCategory,
    priorityFilter,
    setPriorityFilter,
    contextualFilter,
    setContextualFilter,
    getMarkersByCategory,
    getCriticalMarkers,
    getSeasonalMarkers,
    exportMarkers
  };
};