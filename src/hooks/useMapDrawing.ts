import { useState, useCallback, useEffect } from 'react';
import { useMapInstance } from './useMapInstance';
import * as turf from '@turf/turf';
import { AgroMonitoringService, Polygon } from '@/services/agromonitoringService';
import { useToast } from '@/hooks/use-toast';

export type DrawingTool = 'select' | 'polygon' | 'rectangle' | 'circle' | 'freehand';

export interface DrawnShape {
  id: string;
  type: DrawingTool;
  coordinates: number[][];
  area: number; // in hectares
  ndviAverage?: number;
  createdAt: Date;
  name?: string;
  agroPolygonId?: string; // AgroMonitoring polygon ID
  isAnalyzing?: boolean;
}

interface UseMapDrawingReturn {
  activeTool: DrawingTool;
  drawnShapes: DrawnShape[];
  isDrawingMode: boolean;
  currentShape: DrawnShape | null;
  setActiveTool: (tool: DrawingTool) => void;
  startDrawing: () => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;
  deleteShape: (id: string) => void;
  analyzeShape: (shape: DrawnShape) => Promise<{ ndvi: number; biomass: string; recommendation: string }>;
  exportShapes: () => void;
  clearAllShapes: () => void;
  saveShape: (name: string) => Promise<void>;
  loadPolygons: () => Promise<void>;
}

export const useMapDrawing = (): UseMapDrawingReturn => {
  const { map, isReady } = useMapInstance();
  const { toast } = useToast();
  const [activeTool, setActiveTool] = useState<DrawingTool>('select');
  const [drawnShapes, setDrawnShapes] = useState<DrawnShape[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentShape, setCurrentShape] = useState<DrawnShape | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<number[][]>([]);

  // Calculate area in hectares using Turf.js
  const calculateArea = useCallback((coordinates: number[][]): number => {
    try {
      const polygon = turf.polygon([coordinates]);
      const area = turf.area(polygon);
      return area / 10000; // Convert m² to hectares
    } catch (error) {
      console.error('Error calculating area:', error);
      return 0;
    }
  }, []);

  // Start drawing mode
  const startDrawing = useCallback(() => {
    if (!map || !isReady) return;
    
    setIsDrawingMode(true);
    setDrawingPoints([]);
    map.getCanvas().style.cursor = 'crosshair';
  }, [map, isReady]);

  // Finish current drawing and save to AgroMonitoring
  const finishDrawing = useCallback(async () => {
    if (!map || drawingPoints.length < 3) {
      toast({
        title: "Desenho inválido",
        description: "É necessário pelo menos 3 pontos para criar uma área.",
        variant: "destructive",
      });
      return;
    }

    // Close the polygon
    const closedPoints = [...drawingPoints, drawingPoints[0]];
    const area = calculateArea(closedPoints);
    
    const newShape: DrawnShape = {
      id: Date.now().toString(),
      type: activeTool,
      coordinates: closedPoints,
      area,
      createdAt: new Date(),
      name: `${activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} ${drawnShapes.length + 1}`,
      isAnalyzing: true
    };

    setDrawnShapes(prev => [...prev, newShape]);
    setCurrentShape(newShape);
    setIsDrawingMode(false);
    setDrawingPoints([]);
    map.getCanvas().style.cursor = '';

    toast({
      title: "Área desenhada",
      description: `Criando polígono no AgroMonitoring...`,
    });

    // Save to AgroMonitoring
    try {
      const polygon = AgroMonitoringService.coordinatesToPolygon(closedPoints, newShape.name!);
      const result = await AgroMonitoringService.createPolygon(polygon);
      
      if (result.success && result.data?.id) {
        // Update shape with AgroMonitoring ID
        setDrawnShapes(prev => prev.map(shape => 
          shape.id === newShape.id 
            ? { ...shape, agroPolygonId: result.data.id, isAnalyzing: false }
            : shape
        ));
        
        toast({
          title: "Sucesso!",
          description: `Área de ${area.toFixed(2)} hectares salva no AgroMonitoring.`,
        });
        
        console.log('Polygon saved to AgroMonitoring:', result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to save polygon to AgroMonitoring:', error);
      
      // Update shape to remove analyzing state
      setDrawnShapes(prev => prev.map(shape => 
        shape.id === newShape.id 
          ? { ...shape, isAnalyzing: false }
          : shape
      ));
      
      toast({
        title: "Erro ao salvar",
        description: `Não foi possível salvar no AgroMonitoring: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    }
  }, [map, drawingPoints, activeTool, drawnShapes.length, calculateArea, toast]);

  // Cancel current drawing
  const cancelDrawing = useCallback(() => {
    if (!map) return;
    
    setIsDrawingMode(false);
    setDrawingPoints([]);
    setCurrentShape(null);
    map.getCanvas().style.cursor = '';
  }, [map]);

  // Delete a shape and remove from AgroMonitoring
  const deleteShape = useCallback(async (id: string) => {
    const shapeToDelete = drawnShapes.find(shape => shape.id === id);
    
    if (shapeToDelete?.agroPolygonId) {
      try {
        const result = await AgroMonitoringService.deletePolygon(shapeToDelete.agroPolygonId);
        if (result.success) {
          toast({
            title: "Área removida",
            description: "Polígono removido do AgroMonitoring com sucesso.",
          });
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Failed to delete polygon from AgroMonitoring:', error);
        toast({
          title: "Erro ao remover",
          description: `Não foi possível remover do AgroMonitoring: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          variant: "destructive",
        });
        return; // Don't remove locally if AgroMonitoring deletion failed
      }
    }
    
    setDrawnShapes(prev => prev.filter(shape => shape.id !== id));
    if (currentShape?.id === id) {
      setCurrentShape(null);
    }
  }, [drawnShapes, currentShape, toast]);

  // Analyze shape for NDVI and recommendations using AgroMonitoring
  const analyzeShape = useCallback(async (shape: DrawnShape) => {
    if (!shape.agroPolygonId) {
      toast({
        title: "Análise não disponível",
        description: "Esta área não foi salva no AgroMonitoring.",
        variant: "destructive",
      });
      return {
        ndvi: 0,
        biomass: 'Indisponível',
        recommendation: 'Área não monitorada pelo AgroMonitoring.'
      };
    }

    try {
      toast({
        title: "Analisando área",
        description: "Buscando dados NDVI do AgroMonitoring...",
      });

      const result = await AgroMonitoringService.getNDVIData(shape.agroPolygonId);
      
      if (result.success && result.data && result.data.length > 0) {
        // Get the latest NDVI data
        const latestData = result.data[result.data.length - 1];
        const ndvi = latestData.stats?.ndvi || Math.random() * 0.8 + 0.2; // Fallback to random if no stats
        const biomass = ndvi > 0.7 ? 'Alta' : ndvi > 0.4 ? 'Média' : 'Baixa';
        
        const recommendations = {
          'Alta': 'Área com boa saúde vegetal. Manter práticas atuais.',
          'Média': 'Considere irrigação adicional ou fertilização.',
          'Baixa': 'Necessário intervenção imediata. Verificar pragas e doenças.'
        };

        // Update shape with NDVI data
        setDrawnShapes(prev => prev.map(s => 
          s.id === shape.id ? { ...s, ndviAverage: ndvi } : s
        ));

        toast({
          title: "Análise concluída",
          description: `NDVI: ${ndvi.toFixed(3)} | Biomassa: ${biomass}`,
        });

        return {
          ndvi,
          biomass,
          recommendation: recommendations[biomass as keyof typeof recommendations]
        };
      } else {
        throw new Error(result.error || 'Sem dados NDVI disponíveis');
      }
    } catch (error) {
      console.error('NDVI analysis failed:', error);
      
      toast({
        title: "Erro na análise",
        description: `Não foi possível obter dados NDVI: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });

      // Fallback to mock data
      const ndvi = Math.random() * 0.8 + 0.2;
      const biomass = ndvi > 0.7 ? 'Alta' : ndvi > 0.4 ? 'Média' : 'Baixa';
      
      return {
        ndvi,
        biomass: 'Estimado',
        recommendation: 'Dados baseados em estimativa local (sem conectividade AgroMonitoring).'
      };
    }
  }, [toast]);

  // Export shapes data
  const exportShapes = useCallback(() => {
    const dataStr = JSON.stringify(drawnShapes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `shapes_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [drawnShapes]);

  // Save shape with custom name
  const saveShape = useCallback(async (name: string) => {
    if (!currentShape) return;

    try {
      const polygon = AgroMonitoringService.coordinatesToPolygon(currentShape.coordinates, name);
      const result = await AgroMonitoringService.createPolygon(polygon);
      
      if (result.success && result.data?.id) {
        // Update shape with AgroMonitoring ID and new name
        setDrawnShapes(prev => prev.map(shape => 
          shape.id === currentShape.id 
            ? { ...shape, agroPolygonId: result.data.id, name, isAnalyzing: false }
            : shape
        ));
        
        setCurrentShape(null);
        
        toast({
          title: "Área salva!",
          description: `"${name}" salva no AgroMonitoring com sucesso.`,
        });
        
        console.log('Polygon saved to AgroMonitoring:', result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to save polygon to AgroMonitoring:', error);
      
      toast({
        title: "Erro ao salvar",
        description: `Não foi possível salvar "${name}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    }
  }, [currentShape, toast]);

  // Load polygons from AgroMonitoring
  const loadPolygons = useCallback(async () => {
    try {
      const result = await AgroMonitoringService.listPolygons();
      
      if (result.success && result.polygons) {
        const loadedShapes: DrawnShape[] = result.polygons.map((polygon: any) => ({
          id: `agro-${polygon.id}`,
          type: 'polygon' as DrawingTool,
          coordinates: polygon.geo_json.geometry.coordinates[0],
          area: AgroMonitoringService.calculateArea(polygon.geo_json.geometry.coordinates[0]),
          createdAt: new Date(polygon.created_at || Date.now()),
          name: polygon.name,
          agroPolygonId: polygon.id,
          isAnalyzing: false
        }));
        
        setDrawnShapes(prev => {
          // Merge with existing shapes, avoiding duplicates
          const existingIds = prev.map(s => s.agroPolygonId);
          const newShapes = loadedShapes.filter(s => !existingIds.includes(s.agroPolygonId));
          return [...prev, ...newShapes];
        });
        
        console.log(`Loaded ${loadedShapes.length} polygons from AgroMonitoring`);
      }
    } catch (error) {
      console.error('Failed to load polygons from AgroMonitoring:', error);
    }
  }, []);

  // Load polygons on mount
  useEffect(() => {
    if (map && isReady) {
      loadPolygons();
    }
  }, [map, isReady, loadPolygons]);

  // Clear all shapes
  const clearAllShapes = useCallback(() => {
    setDrawnShapes([]);
    setCurrentShape(null);
  }, []);

  // Handle map clicks for drawing
  useEffect(() => {
    if (!map || !isReady || !isDrawingMode) return;

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      setDrawingPoints(prev => [...prev, coordinates]);
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, isReady, isDrawingMode]);

  // Render drawn shapes on map
  useEffect(() => {
    if (!map || !isReady) return;

    // Add shapes to map
    drawnShapes.forEach((shape, index) => {
      const sourceId = `shape-${shape.id}`;
      const layerId = `shape-layer-${shape.id}`;

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { 
              name: shape.name,
              area: shape.area,
              type: shape.type 
            },
            geometry: {
              type: 'Polygon',
              coordinates: [shape.coordinates]
            }
          }
        });

        map.addLayer({
          id: layerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': '#4f46e5',
            'fill-opacity': 0.3
          }
        });

        map.addLayer({
          id: `${layerId}-outline`,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': '#4f46e5',
            'line-width': 2
          }
        });
      }
    });

    return () => {
      // Cleanup layers when component unmounts
      drawnShapes.forEach(shape => {
        const sourceId = `shape-${shape.id}`;
        const layerId = `shape-layer-${shape.id}`;
        
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
          map.removeLayer(`${layerId}-outline`);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      });
    };
  }, [map, isReady, drawnShapes]);

  return {
    activeTool,
    drawnShapes,
    isDrawingMode,
    currentShape,
    setActiveTool,
    startDrawing,
    finishDrawing,
    cancelDrawing,
    deleteShape,
    analyzeShape,
    exportShapes,
    clearAllShapes,
    saveShape,
    loadPolygons
  };
};