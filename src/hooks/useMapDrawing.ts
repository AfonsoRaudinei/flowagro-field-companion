import { useState, useCallback, useEffect } from 'react';
import { useMapInstance } from './useMapInstance';
import * as turf from '@turf/turf';

export type DrawingTool = 'select' | 'polygon' | 'rectangle' | 'circle' | 'freehand';

interface DrawnShape {
  id: string;
  type: DrawingTool;
  coordinates: number[][];
  area: number; // in hectares
  ndviAverage?: number;
  createdAt: Date;
  name?: string;
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
}

export const useMapDrawing = (): UseMapDrawingReturn => {
  const { map, isReady } = useMapInstance();
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

  // Finish current drawing
  const finishDrawing = useCallback(() => {
    if (!map || drawingPoints.length < 3) return;

    // Close the polygon
    const closedPoints = [...drawingPoints, drawingPoints[0]];
    const area = calculateArea(closedPoints);
    
    const newShape: DrawnShape = {
      id: Date.now().toString(),
      type: activeTool,
      coordinates: closedPoints,
      area,
      createdAt: new Date(),
      name: `${activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} ${drawnShapes.length + 1}`
    };

    setDrawnShapes(prev => [...prev, newShape]);
    setCurrentShape(newShape);
    setIsDrawingMode(false);
    setDrawingPoints([]);
    map.getCanvas().style.cursor = '';
  }, [map, drawingPoints, activeTool, drawnShapes.length, calculateArea]);

  // Cancel current drawing
  const cancelDrawing = useCallback(() => {
    if (!map) return;
    
    setIsDrawingMode(false);
    setDrawingPoints([]);
    setCurrentShape(null);
    map.getCanvas().style.cursor = '';
  }, [map]);

  // Delete a shape
  const deleteShape = useCallback((id: string) => {
    setDrawnShapes(prev => prev.filter(shape => shape.id !== id));
    if (currentShape?.id === id) {
      setCurrentShape(null);
    }
  }, [currentShape]);

  // Analyze shape for NDVI and recommendations
  const analyzeShape = useCallback(async (shape: DrawnShape) => {
    // Simulate analysis with mock data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const ndvi = Math.random() * 0.8 + 0.2; // 0.2 to 1.0
    const biomass = ndvi > 0.7 ? 'Alta' : ndvi > 0.4 ? 'Média' : 'Baixa';
    
    const recommendations = {
      'Alta': 'Área com boa saúde vegetal. Manter práticas atuais.',
      'Média': 'Considere irrigação adicional ou fertilização.',
      'Baixa': 'Necessário intervenção imediata. Verificar pragas e doenças.'
    };

    return {
      ndvi,
      biomass,
      recommendation: recommendations[biomass as keyof typeof recommendations]
    };
  }, []);

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
    clearAllShapes
  };
};