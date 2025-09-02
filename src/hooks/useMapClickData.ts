import { useState, useCallback, useEffect } from 'react';
import { useMapInstance } from './useMapInstance';

interface MapClickData {
  coordinates: [number, number];
  ndvi: number | null;
  weather: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
  } | null;
  soil: {
    moisture: number;
    ph: number;
    organic_matter: number;
    nitrogen: number;
  } | null;
  elevation: number | null;
  growthStage: string | null;
}

interface UseMapClickDataReturn {
  clickData: MapClickData | null;
  isLoading: boolean;
  error: string | null;
  clearData: () => void;
}

export const useMapClickData = (): UseMapClickDataReturn => {
  const { map } = useMapInstance();
  const [clickData, setClickData] = useState<MapClickData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContextualData = useCallback(async (coordinates: [number, number]): Promise<MapClickData> => {
    // Simulate API calls for different data layers
    const [lng, lat] = coordinates;
    
    // Mock NDVI data
    const ndvi = Math.random() * 0.8 + 0.2; // 0.2 to 1.0
    
    // Mock weather data
    const weather = {
      temperature: Math.round(Math.random() * 15 + 20), // 20-35°C
      humidity: Math.round(Math.random() * 40 + 40), // 40-80%
      windSpeed: Math.round(Math.random() * 20 + 5), // 5-25 km/h
      precipitation: Math.round(Math.random() * 10), // 0-10mm
    };

    // Mock soil data
    const soil = {
      moisture: Math.round(Math.random() * 50 + 30), // 30-80%
      ph: Math.round((Math.random() * 3 + 5.5) * 10) / 10, // 5.5-8.5
      organic_matter: Math.round((Math.random() * 4 + 1) * 10) / 10, // 1-5%
      nitrogen: Math.round(Math.random() * 50 + 20), // 20-70 ppm
    };

    // Mock elevation
    const elevation = Math.round(Math.random() * 500 + 200); // 200-700m

    // Mock growth stage
    const stages = ['Germinação', 'Desenvolvimento Vegetativo', 'Floração', 'Frutificação', 'Maturação'];
    const growthStage = stages[Math.floor(Math.random() * stages.length)];

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      coordinates,
      ndvi,
      weather,
      soil,
      elevation,
      growthStage,
    };
  }, []);

  const handleMapClick = useCallback(async (coordinates: [number, number]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchContextualData(coordinates);
      setClickData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      setClickData(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchContextualData]);

  // Set up map click listener
  useEffect(() => {
    if (!map) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      handleMapClick(coordinates);
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map, handleMapClick]);

  const clearData = useCallback(() => {
    setClickData(null);
    setError(null);
  }, []);

  return {
    clickData,
    isLoading,
    error,
    clearData,
  };
};