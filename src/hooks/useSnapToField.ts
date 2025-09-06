import { useState, useCallback, useEffect } from 'react';
import { useMapInstance } from './useMapInstance';
import * as turf from '@turf/turf';
import { logger } from '@/lib/logger';

export interface SnapSettings {
  enabled: boolean;
  tolerance: number; // in meters
  snapToEdges: boolean;
  snapToVertices: boolean;
  showSnapPreview: boolean;
}

export interface SnapResult {
  originalPoint: [number, number];
  snappedPoint: [number, number];
  wasSnapped: boolean;
  snapType: 'edge' | 'vertex' | 'none';
  distance: number; // distance to snap target in meters
}

export interface FieldBoundary {
  id: string;
  coordinates: [number, number][];
  confidence: number; // 0-1, how confident we are this is a field boundary
  source: 'ndvi' | 'manual' | 'satellite';
}

export interface UseSnapToFieldReturn {
  settings: SnapSettings;
  updateSettings: (updates: Partial<SnapSettings>) => void;
  snapPoint: (point: [number, number]) => SnapResult;
  fieldBoundaries: FieldBoundary[];
  isAnalyzing: boolean;
  analyzeFieldBoundaries: (center: [number, number], radius: number) => Promise<void>;
  clearBoundaries: () => void;
}

export const useSnapToField = (): UseSnapToFieldReturn => {
  const { map, isReady } = useMapInstance();
  
  // Settings state
  const [settings, setSettings] = useState<SnapSettings>({
    enabled: true,
    tolerance: 10, // 10 meters default
    snapToEdges: true,
    snapToVertices: true,
    showSnapPreview: true
  });

  // Field boundaries detected from analysis
  const [fieldBoundaries, setFieldBoundaries] = useState<FieldBoundary[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Update settings
  const updateSettings = useCallback((updates: Partial<SnapSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Simulate field boundary detection using NDVI analysis
  const analyzeFieldBoundaries = useCallback(async (center: [number, number], radius: number) => {
    if (!map || !isReady) return;

    setIsAnalyzing(true);

    try {
      // Simulate NDVI-based field boundary detection
      // In a real implementation, this would:
      // 1. Fetch NDVI data for the area
      // 2. Apply edge detection algorithms
      // 3. Extract polygon boundaries
      // 4. Filter based on confidence thresholds

      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time

      // Generate mock field boundaries for demonstration
      const mockBoundaries: FieldBoundary[] = [];
      
      // Create a few sample field boundaries around the center point
      const numFields = Math.floor(Math.random() * 3) + 2; // 2-4 fields
      
      for (let i = 0; i < numFields; i++) {
        const fieldRadius = (radius * 0.3) + (Math.random() * radius * 0.4);
        const offsetAngle = (i / numFields) * 2 * Math.PI;
        const offsetDistance = Math.random() * radius * 0.5;
        
        const fieldCenter: [number, number] = [
          center[0] + (Math.cos(offsetAngle) * offsetDistance / 111320), // rough conversion to degrees
          center[1] + (Math.sin(offsetAngle) * offsetDistance / 111320)
        ];

        // Create a rough rectangular field with some variation
        const fieldBounds = turf.buffer(turf.point(fieldCenter), fieldRadius, { units: 'meters' });
        const simplified = turf.simplify(fieldBounds, { tolerance: 0.001, highQuality: true });
        
        if (simplified.geometry.type === 'Polygon') {
          const coordinates = simplified.geometry.coordinates[0].map(coord => [coord[0], coord[1]] as [number, number]);
          
          mockBoundaries.push({
            id: `field_${i}_${Date.now()}`,
            coordinates: coordinates.slice(0, -1), // Remove last point (duplicate of first)
            confidence: 0.7 + Math.random() * 0.3, // 0.7-1.0 confidence
            source: 'ndvi'
          });
        }
      }

      setFieldBoundaries(mockBoundaries);
    } catch (error) {
      logger.error('Error analyzing field boundaries', { error });
    } finally {
      setIsAnalyzing(false);
    }
  }, [map, isReady]);

  // Clear all detected boundaries
  const clearBoundaries = useCallback(() => {
    setFieldBoundaries([]);
  }, []);

  // Find the closest snap target for a given point
  const findClosestSnapTarget = useCallback((point: [number, number]): {
    point: [number, number];
    distance: number;
    type: 'edge' | 'vertex';
  } | null => {
    if (!settings.enabled || fieldBoundaries.length === 0) return null;

    let closestTarget: { point: [number, number]; distance: number; type: 'edge' | 'vertex' } | null = null;
    const pointFeature = turf.point(point);

    for (const boundary of fieldBoundaries) {
      if (boundary.confidence < 0.5) continue; // Skip low-confidence boundaries

      // Check snap to vertices
      if (settings.snapToVertices) {
        for (const vertex of boundary.coordinates) {
          const vertexFeature = turf.point(vertex);
          const distance = turf.distance(pointFeature, vertexFeature, { units: 'meters' });
          
          if (distance <= settings.tolerance && (!closestTarget || distance < closestTarget.distance)) {
            closestTarget = {
              point: vertex,
              distance,
              type: 'vertex'
            };
          }
        }
      }

      // Check snap to edges
      if (settings.snapToEdges) {
        for (let i = 0; i < boundary.coordinates.length; i++) {
          const start = boundary.coordinates[i];
          const end = boundary.coordinates[(i + 1) % boundary.coordinates.length];
          
          const lineSegment = turf.lineString([start, end]);
          const closestPoint = turf.nearestPointOnLine(lineSegment, pointFeature);
          const distance = closestPoint.properties.dist! * 1000; // Convert km to meters
          
          if (distance <= settings.tolerance && (!closestTarget || distance < closestTarget.distance)) {
            closestTarget = {
              point: [closestPoint.geometry.coordinates[0], closestPoint.geometry.coordinates[1]],
              distance,
              type: 'edge'
            };
          }
        }
      }
    }

    return closestTarget;
  }, [settings, fieldBoundaries]);

  // Main snap function
  const snapPoint = useCallback((point: [number, number]): SnapResult => {
    if (!settings.enabled) {
      return {
        originalPoint: point,
        snappedPoint: point,
        wasSnapped: false,
        snapType: 'none',
        distance: 0
      };
    }

    const snapTarget = findClosestSnapTarget(point);
    
    if (snapTarget) {
      return {
        originalPoint: point,
        snappedPoint: snapTarget.point,
        wasSnapped: true,
        snapType: snapTarget.type,
        distance: snapTarget.distance
      };
    }

    return {
      originalPoint: point,
      snappedPoint: point,
      wasSnapped: false,
      snapType: 'none',
      distance: 0
    };
  }, [settings, findClosestSnapTarget]);

  // Render field boundaries on map for visual feedback
  useEffect(() => {
    if (!map || !isReady || !settings.showSnapPreview) return;

    const sourceId = 'snap-field-boundaries';
    const layerId = 'snap-field-boundaries-layer';
    const strokeLayerId = 'snap-field-boundaries-stroke';

    // Remove existing layers
    if (map.getLayer(strokeLayerId)) map.removeLayer(strokeLayerId);
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    if (fieldBoundaries.length === 0) return;

    // Create GeoJSON features for all boundaries
    const features = fieldBoundaries.map(boundary => {
      const closedCoords = [...boundary.coordinates];
      if (closedCoords.length > 0 && 
          (closedCoords[0][0] !== closedCoords[closedCoords.length - 1][0] || 
           closedCoords[0][1] !== closedCoords[closedCoords.length - 1][1])) {
        closedCoords.push(closedCoords[0]);
      }

      return {
        type: 'Feature' as const,
        properties: {
          id: boundary.id,
          confidence: boundary.confidence,
          source: boundary.source
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [closedCoords]
        }
      };
    });

    // Add source
    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features
      }
    });

    // Add fill layer with low opacity
    map.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'confidence'],
          0.5, 'rgba(100, 149, 237, 0.05)', // Low confidence - light blue
          1.0, 'rgba(34, 139, 34, 0.1)'     // High confidence - green
        ],
        'fill-opacity': 0.3
      }
    });

    // Add stroke layer
    map.addLayer({
      id: strokeLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': [
          'interpolate',
          ['linear'],
          ['get', 'confidence'],
          0.5, '#6495ED', // Low confidence - cornflower blue
          1.0, '#228B22'  // High confidence - forest green
        ],
        'line-width': [
          'interpolate',
          ['linear'],
          ['get', 'confidence'],
          0.5, 1,
          1.0, 2
        ],
        'line-opacity': 0.6,
        'line-dasharray': [
          'case',
          ['<', ['get', 'confidence'], 0.7],
          ['literal', [2, 2]], // Dashed for low confidence
          ['literal', []]       // Solid for high confidence
        ]
      }
    });

    // Cleanup function
    return () => {
      if (map.getLayer(strokeLayerId)) map.removeLayer(strokeLayerId);
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, isReady, fieldBoundaries, settings.showSnapPreview]);

  return {
    settings,
    updateSettings,
    snapPoint,
    fieldBoundaries,
    isAnalyzing,
    analyzeFieldBoundaries,
    clearBoundaries
  };
};