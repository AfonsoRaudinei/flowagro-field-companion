import { useState, useCallback, useEffect } from 'react';

interface ComparisonData {
  date: Date;
  ndvi: number;
  weather: {
    temperature: number;
    precipitation: number;
    humidity: number;
  };
  soil: {
    moisture: number;
  };
}

interface ComparisonAnalysis {
  ndviDifference: number;
  temperatureDifference: number;
  precipitationDifference: number;
  soilMoistureDifference: number;
  changePercentage: number;
  significantChange: boolean;
}

interface UseComparisonModeReturn {
  isComparisonMode: boolean;
  setComparisonMode: (enabled: boolean) => void;
  leftDate: Date;
  rightDate: Date;
  setLeftDate: (date: Date) => void;
  setRightDate: (date: Date) => void;
  leftData: ComparisonData | null;
  rightData: ComparisonData | null;
  analysis: ComparisonAnalysis | null;
  isLoading: boolean;
  error: string | null;
  swapDates: () => void;
  loadPreset: (preset: 'year-comparison' | 'season-comparison' | 'growth-comparison') => void;
}

export const useComparisonMode = (): UseComparisonModeReturn => {
  const [isComparisonMode, setComparisonMode] = useState(false);
  const [leftDate, setLeftDate] = useState(new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate()));
  const [rightDate, setRightDate] = useState(new Date());
  const [leftData, setLeftData] = useState<ComparisonData | null>(null);
  const [rightData, setRightData] = useState<ComparisonData | null>(null);
  const [analysis, setAnalysis] = useState<ComparisonAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateMockData = useCallback((date: Date): ComparisonData => {
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    // Seasonal NDVI variation
    const seasonalNdvi = 0.5 + 0.3 * Math.sin((dayOfYear / 365) * 2 * Math.PI);
    const noise = (Math.random() - 0.5) * 0.1;
    const ndvi = Math.max(0.1, Math.min(1.0, seasonalNdvi + noise));
    
    // Weather patterns
    const temperature = 25 + 10 * Math.sin((dayOfYear / 365) * 2 * Math.PI) + (Math.random() - 0.5) * 8;
    const precipitation = Math.max(0, Math.random() * 12);
    const humidity = 50 + 25 * Math.sin((dayOfYear / 365) * 2 * Math.PI + Math.PI) + (Math.random() - 0.5) * 20;
    
    // Soil moisture
    const soilMoisture = Math.max(20, Math.min(80, 50 + precipitation * 1.5 + humidity * 0.2 + (Math.random() - 0.5) * 15));
    
    return {
      date,
      ndvi,
      weather: {
        temperature: Math.round(temperature),
        precipitation: Math.round(precipitation),
        humidity: Math.round(humidity),
      },
      soil: {
        moisture: Math.round(soilMoisture),
      },
    };
  }, []);

  const calculateAnalysis = useCallback((left: ComparisonData, right: ComparisonData): ComparisonAnalysis => {
    const ndviDifference = right.ndvi - left.ndvi;
    const temperatureDifference = right.weather.temperature - left.weather.temperature;
    const precipitationDifference = right.weather.precipitation - left.weather.precipitation;
    const soilMoistureDifference = right.soil.moisture - left.soil.moisture;
    
    const changePercentage = Math.abs(ndviDifference / left.ndvi) * 100;
    const significantChange = changePercentage > 15; // 15% change considered significant
    
    return {
      ndviDifference,
      temperatureDifference,
      precipitationDifference,
      soilMoistureDifference,
      changePercentage,
      significantChange,
    };
  }, []);

  const loadComparisonData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const leftMockData = generateMockData(leftDate);
      const rightMockData = generateMockData(rightDate);
      
      setLeftData(leftMockData);
      setRightData(rightMockData);
      
      const comparisonAnalysis = calculateAnalysis(leftMockData, rightMockData);
      setAnalysis(comparisonAnalysis);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados de comparação');
    } finally {
      setIsLoading(false);
    }
  }, [leftDate, rightDate, generateMockData, calculateAnalysis]);

  // Load data when dates change or comparison mode is enabled
  useEffect(() => {
    if (isComparisonMode) {
      loadComparisonData();
    }
  }, [isComparisonMode, leftDate, rightDate, loadComparisonData]);

  const swapDates = useCallback(() => {
    const temp = leftDate;
    setLeftDate(rightDate);
    setRightDate(temp);
  }, [leftDate, rightDate]);

  const loadPreset = useCallback((preset: 'year-comparison' | 'season-comparison' | 'growth-comparison') => {
    const today = new Date();
    
    switch (preset) {
      case 'year-comparison':
        setLeftDate(new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()));
        setRightDate(today);
        break;
      case 'season-comparison':
        setLeftDate(new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()));
        setRightDate(today);
        break;
      case 'growth-comparison':
        setLeftDate(new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()));
        setRightDate(today);
        break;
    }
  }, []);

  return {
    isComparisonMode,
    setComparisonMode,
    leftDate,
    rightDate,
    setLeftDate,
    setRightDate,
    leftData,
    rightData,
    analysis,
    isLoading,
    error,
    swapDates,
    loadPreset,
  };
};