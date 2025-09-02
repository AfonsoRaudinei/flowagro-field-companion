import { useState, useCallback, useEffect, useRef } from 'react';
import { useMapInstance } from './useMapInstance';
import { UnitService, UnitType, AreaMeasurement } from '@/services/unitService';
import * as turf from '@turf/turf';
import mapboxgl from 'mapbox-gl';

export type MeasurementTool = 'ruler' | 'area' | 'perimeter' | 'select';

export interface DistanceMeasurement {
  id: string;
  coordinates: [number, number][];
  distance: number; // in meters
  unit: 'meters' | 'kilometers' | 'feet';
  createdAt: Date;
}

export interface AreaMeasurementData {
  id: string;
  coordinates: [number, number][];
  area: AreaMeasurement;
  perimeter: number; // in meters
  preferredUnit: UnitType;
  createdAt: Date;
  snapToField?: boolean;
}

export interface UseMeasurementToolsReturn {
  // Current state
  activeTool: MeasurementTool;
  isMeasuring: boolean;
  measurements: {
    distances: DistanceMeasurement[];
    areas: AreaMeasurementData[];
  };
  
  // Current measurement being drawn
  currentPoints: [number, number][];
  currentDistance: number | null;
  currentArea: AreaMeasurement | null;
  
  // Actions
  setActiveTool: (tool: MeasurementTool) => void;
  startMeasurement: () => void;
  finishMeasurement: () => void;
  cancelMeasurement: () => void;
  clearAllMeasurements: () => void;
  deleteMeasurement: (type: 'distance' | 'area', id: string) => void;
  
  // Settings
  preferredAreaUnit: UnitType;
  setPreferredAreaUnit: (unit: UnitType) => void;
  snapToFieldEnabled: boolean;
  setSnapToFieldEnabled: (enabled: boolean) => void;
  
  // Export
  exportMeasurements: () => void;
}

export const useMeasurementTools = (): UseMeasurementToolsReturn => {
  const { map, isReady } = useMapInstance();
  
  // State management
  const [activeTool, setActiveTool] = useState<MeasurementTool>('select');
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<[number, number][]>([]);
  const [measurements, setMeasurements] = useState<{
    distances: DistanceMeasurement[];
    areas: AreaMeasurementData[];
  }>({
    distances: [],
    areas: []
  });
  
  // Settings
  const [preferredAreaUnit, setPreferredAreaUnit] = useState<UnitType>('ha');
  const [snapToFieldEnabled, setSnapToFieldEnabled] = useState(true);
  
  // Refs for cleanup
  const sourcesRef = useRef<Set<string>>(new Set());
  const layersRef = useRef<Set<string>>(new Set());

  // Calculate current measurements
  const currentDistance = currentPoints.length >= 2 && activeTool === 'ruler' 
    ? calculateDistance(currentPoints) 
    : null;
    
  const currentArea = currentPoints.length >= 3 && (activeTool === 'area' || activeTool === 'perimeter')
    ? calculateArea(currentPoints)
    : null;

  // Utility functions
  function calculateDistance(points: [number, number][]): number {
    if (points.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const from = turf.point(points[i - 1]);
      const to = turf.point(points[i]);
      totalDistance += turf.distance(from, to, { units: 'meters' });
    }
    return totalDistance;
  }

  function calculateArea(points: [number, number][]): AreaMeasurement {
    if (points.length < 3) {
      return UnitService.convertArea(0);
    }
    
    try {
      // Close the polygon if not already closed
      const closedPoints = [...points];
      if (closedPoints[0][0] !== closedPoints[closedPoints.length - 1][0] || 
          closedPoints[0][1] !== closedPoints[closedPoints.length - 1][1]) {
        closedPoints.push(closedPoints[0]);
      }
      
      const polygon = turf.polygon([closedPoints]);
      const areaM2 = turf.area(polygon);
      return UnitService.convertArea(areaM2);
    } catch (error) {
      console.error('Error calculating area:', error);
      return UnitService.convertArea(0);
    }
  }

  // Snap to field functionality (simplified - can be enhanced with NDVI data)
  const snapToField = useCallback((point: [number, number]): [number, number] => {
    if (!snapToFieldEnabled || !map) return point;
    
    // Simple snap logic - can be enhanced with field boundary detection
    const snapRadius = 0.001; // ~100m tolerance
    
    // For now, just return the original point
    // In a real implementation, this would:
    // 1. Query NDVI data around the point
    // 2. Detect field boundaries using edge detection
    // 3. Snap to the nearest detected boundary
    
    return point;
  }, [snapToFieldEnabled, map]);

  // Map interaction handlers
  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    if (!isMeasuring || activeTool === 'select') return;
    
    const clickPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    const snappedPoint = snapToField(clickPoint);
    
    setCurrentPoints(prev => [...prev, snappedPoint]);
  }, [isMeasuring, activeTool, snapToField]);

  const handleMapDoubleClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    if (!isMeasuring) return;
    
    e.preventDefault();
    finishMeasurement();
  }, [isMeasuring]);

  // Tool actions
  const startMeasurement = useCallback(() => {
    if (activeTool === 'select') return;
    
    setIsMeasuring(true);
    setCurrentPoints([]);
    
    if (map) {
      map.getCanvas().style.cursor = 'crosshair';
    }
  }, [activeTool, map]);

  const finishMeasurement = useCallback(() => {
    if (!isMeasuring || currentPoints.length === 0) {
      setIsMeasuring(false);
      setCurrentPoints([]);
      if (map) {
        map.getCanvas().style.cursor = 'default';
      }
      return;
    }

    const id = `measurement_${Date.now()}`;
    const createdAt = new Date();

    if (activeTool === 'ruler' && currentPoints.length >= 2) {
      const distance = calculateDistance(currentPoints);
      const newDistance: DistanceMeasurement = {
        id,
        coordinates: [...currentPoints],
        distance,
        unit: distance > 1000 ? 'kilometers' : 'meters',
        createdAt
      };
      
      setMeasurements(prev => ({
        ...prev,
        distances: [...prev.distances, newDistance]
      }));
    } else if ((activeTool === 'area' || activeTool === 'perimeter') && currentPoints.length >= 3) {
      const area = calculateArea(currentPoints);
      const perimeter = calculateDistance([...currentPoints, currentPoints[0]]);
      
      const newArea: AreaMeasurementData = {
        id,
        coordinates: [...currentPoints],
        area,
        perimeter,
        preferredUnit: preferredAreaUnit,
        createdAt,
        snapToField: snapToFieldEnabled
      };
      
      setMeasurements(prev => ({
        ...prev,
        areas: [...prev.areas, newArea]
      }));
    }

    setIsMeasuring(false);
    setCurrentPoints([]);
    if (map) {
      map.getCanvas().style.cursor = 'default';
    }
  }, [isMeasuring, currentPoints, activeTool, preferredAreaUnit, snapToFieldEnabled, map]);

  const cancelMeasurement = useCallback(() => {
    setIsMeasuring(false);
    setCurrentPoints([]);
    if (map) {
      map.getCanvas().style.cursor = 'default';
    }
  }, [map]);

  const clearAllMeasurements = useCallback(() => {
    setMeasurements({
      distances: [],
      areas: []
    });
    cancelMeasurement();
  }, [cancelMeasurement]);

  const deleteMeasurement = useCallback((type: 'distance' | 'area', id: string) => {
    setMeasurements(prev => ({
      ...prev,
      [type === 'distance' ? 'distances' : 'areas']: 
        prev[type === 'distance' ? 'distances' : 'areas'].filter(m => m.id !== id)
    }));
  }, []);

  const exportMeasurements = useCallback(() => {
    const data = {
      exportDate: new Date().toISOString(),
      settings: {
        preferredAreaUnit,
        snapToFieldEnabled
      },
      measurements: {
        distances: measurements.distances.map(d => ({
          ...d,
          distanceFormatted: d.unit === 'kilometers' 
            ? `${(d.distance / 1000).toFixed(2)} km`
            : `${d.distance.toFixed(1)} m`
        })),
        areas: measurements.areas.map(a => ({
          ...a,
          areaFormatted: UnitService.formatArea(a.area.m2, a.preferredUnit),
          perimeterFormatted: `${a.perimeter.toFixed(1)} m`
        }))
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowagro_measurements_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [measurements, preferredAreaUnit, snapToFieldEnabled]);

  // Render measurements on map
  useEffect(() => {
    if (!map || !isReady) return;

    // Clear existing sources and layers
    sourcesRef.current.forEach(sourceId => {
      if (map.getSource(sourceId)) {
        layersRef.current.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
        });
        map.removeSource(sourceId);
      }
    });
    sourcesRef.current.clear();
    layersRef.current.clear();

    // Render distance measurements
    measurements.distances.forEach((distance, index) => {
      const sourceId = `distance-${distance.id}`;
      const lineLayerId = `distance-line-${distance.id}`;
      const pointsLayerId = `distance-points-${distance.id}`;

      if (distance.coordinates.length >= 2) {
        // Line source and layer
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { measurementId: distance.id },
            geometry: {
              type: 'LineString',
              coordinates: distance.coordinates
            }
          }
        });

        map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#FF6B35',
            'line-width': 3,
            'line-opacity': 0.8
          }
        });

        // Points source and layer
        const pointsSourceId = `${sourceId}-points`;
        map.addSource(pointsSourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: distance.coordinates.map((coord, i) => ({
              type: 'Feature',
              properties: { index: i },
              geometry: {
                type: 'Point',
                coordinates: coord
              }
            }))
          }
        });

        map.addLayer({
          id: pointsLayerId,
          type: 'circle',
          source: pointsSourceId,
          paint: {
            'circle-color': '#FF6B35',
            'circle-radius': 4,
            'circle-stroke-color': '#FFFFFF',
            'circle-stroke-width': 2
          }
        });

        sourcesRef.current.add(sourceId);
        sourcesRef.current.add(pointsSourceId);
        layersRef.current.add(lineLayerId);
        layersRef.current.add(pointsLayerId);
      }
    });

    // Render area measurements
    measurements.areas.forEach((area) => {
      const sourceId = `area-${area.id}`;
      const fillLayerId = `area-fill-${area.id}`;
      const strokeLayerId = `area-stroke-${area.id}`;
      const pointsLayerId = `area-points-${area.id}`;

      if (area.coordinates.length >= 3) {
        // Close polygon
        const closedCoords = [...area.coordinates];
        if (closedCoords[0][0] !== closedCoords[closedCoords.length - 1][0] || 
            closedCoords[0][1] !== closedCoords[closedCoords.length - 1][1]) {
          closedCoords.push(closedCoords[0]);
        }

        // Polygon source
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { measurementId: area.id },
            geometry: {
              type: 'Polygon',
              coordinates: [closedCoords]
            }
          }
        });

        // Fill layer
        map.addLayer({
          id: fillLayerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': '#4CAF50',
            'fill-opacity': 0.2
          }
        });

        // Stroke layer
        map.addLayer({
          id: strokeLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': '#4CAF50',
            'line-width': 2,
            'line-opacity': 0.8
          }
        });

        // Points layer
        const pointsSourceId = `${sourceId}-points`;
        map.addSource(pointsSourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: area.coordinates.map((coord, i) => ({
              type: 'Feature',
              properties: { index: i },
              geometry: {
                type: 'Point',
                coordinates: coord
              }
            }))
          }
        });

        map.addLayer({
          id: pointsLayerId,
          type: 'circle',
          source: pointsSourceId,
          paint: {
            'circle-color': '#4CAF50',
            'circle-radius': 4,
            'circle-stroke-color': '#FFFFFF',
            'circle-stroke-width': 2
          }
        });

        sourcesRef.current.add(sourceId);
        sourcesRef.current.add(pointsSourceId);
        layersRef.current.add(fillLayerId);
        layersRef.current.add(strokeLayerId);
        layersRef.current.add(pointsLayerId);
      }
    });

    // Render current measurement
    if (isMeasuring && currentPoints.length > 0) {
      const currentSourceId = 'current-measurement';
      const currentLayerId = 'current-measurement-layer';
      const currentPointsLayerId = 'current-measurement-points';

      if (activeTool === 'ruler' && currentPoints.length >= 1) {
        if (map.getSource(currentSourceId)) {
          map.removeLayer(currentLayerId);
          map.removeLayer(currentPointsLayerId);
          map.removeSource(currentSourceId);
        }

        // Line for current measurement
        if (currentPoints.length >= 2) {
          map.addSource(currentSourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: currentPoints
              }
            }
          });

          map.addLayer({
            id: currentLayerId,
            type: 'line',
            source: currentSourceId,
            paint: {
              'line-color': '#FF6B35',
              'line-width': 3,
              'line-opacity': 0.6,
              'line-dasharray': [2, 2]
            }
          });
        }

        // Points for current measurement
        const pointsSourceId = `${currentSourceId}-points`;
        map.addSource(pointsSourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: currentPoints.map((coord, i) => ({
              type: 'Feature',
              properties: { index: i },
              geometry: {
                type: 'Point',
                coordinates: coord
              }
            }))
          }
        });

        map.addLayer({
          id: currentPointsLayerId,
          type: 'circle',
          source: pointsSourceId,
          paint: {
            'circle-color': '#FF6B35',
            'circle-radius': 5,
            'circle-stroke-color': '#FFFFFF',
            'circle-stroke-width': 2,
            'circle-opacity': 0.8
          }
        });
      } else if ((activeTool === 'area' || activeTool === 'perimeter') && currentPoints.length >= 1) {
        if (map.getSource(currentSourceId)) {
          map.removeLayer(currentLayerId);
          map.removeLayer(currentPointsLayerId);
          map.removeSource(currentSourceId);
        }

        // Polygon for current area measurement
        if (currentPoints.length >= 3) {
          const closedCoords = [...currentPoints, currentPoints[0]];
          
          map.addSource(currentSourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Polygon',
                coordinates: [closedCoords]
              }
            }
          });

          map.addLayer({
            id: currentLayerId,
            type: 'fill',
            source: currentSourceId,
            paint: {
              'fill-color': '#4CAF50',
              'fill-opacity': 0.1
            }
          });
        }

        // Points for current area measurement
        const pointsSourceId = `${currentSourceId}-points`;
        map.addSource(pointsSourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: currentPoints.map((coord, i) => ({
              type: 'Feature',
              properties: { index: i },
              geometry: {
                type: 'Point',
                coordinates: coord
              }
            }))
          }
        });

        map.addLayer({
          id: currentPointsLayerId,
          type: 'circle',
          source: pointsSourceId,
          paint: {
            'circle-color': '#4CAF50',
            'circle-radius': 5,
            'circle-stroke-color': '#FFFFFF',
            'circle-stroke-width': 2,
            'circle-opacity': 0.8
          }
        });
      }
    }

    // Cleanup function
    return () => {
      sourcesRef.current.forEach(sourceId => {
        if (map.getSource(sourceId)) {
          layersRef.current.forEach(layerId => {
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId);
            }
          });
          map.removeSource(sourceId);
        }
      });
    };
  }, [map, isReady, measurements, isMeasuring, currentPoints, activeTool]);

  // Map event listeners
  useEffect(() => {
    if (!map || !isReady) return;

    if (isMeasuring) {
      map.on('click', handleMapClick);
      map.on('dblclick', handleMapDoubleClick);
    }

    return () => {
      map.off('click', handleMapClick);
      map.off('dblclick', handleMapDoubleClick);
    };
  }, [map, isReady, isMeasuring, handleMapClick, handleMapDoubleClick]);

  // Tool change handler
  useEffect(() => {
    if (activeTool === 'select') {
      cancelMeasurement();
    }
    if (map) {
      map.getCanvas().style.cursor = activeTool === 'select' || !isMeasuring ? 'default' : 'crosshair';
    }
  }, [activeTool, isMeasuring, map, cancelMeasurement]);

  return {
    activeTool,
    isMeasuring,
    measurements,
    currentPoints,
    currentDistance,
    currentArea,
    setActiveTool,
    startMeasurement,
    finishMeasurement,
    cancelMeasurement,
    clearAllMeasurements,
    deleteMeasurement,
    preferredAreaUnit,
    setPreferredAreaUnit,
    snapToFieldEnabled,
    setSnapToFieldEnabled,
    exportMeasurements
  };
};