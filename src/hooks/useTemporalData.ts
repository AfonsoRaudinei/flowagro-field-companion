import { useState, useCallback, useEffect } from 'react';
import { addDays, subDays, format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

interface TemporalDataPoint {
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

interface UseTemporalDataReturn {
  currentDate: Date;
  dateRange: [Date, Date];
  temporalData: TemporalDataPoint[];
  isLoading: boolean;
  error: string | null;
  setCurrentDate: (date: Date) => void;
  setDateRange: (range: [Date, Date]) => void;
  playAnimation: boolean;
  setPlayAnimation: (play: boolean) => void;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  jumpToPreset: (preset: 'week' | 'month' | 'season' | 'year') => void;
  nextDate: () => void;
  previousDate: () => void;
  resetToToday: () => void;
}

export const useTemporalData = (): UseTemporalDataReturn => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    subDays(new Date(), 365), // 1 year ago
    new Date()
  ]);
  const [temporalData, setTemporalData] = useState<TemporalDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playAnimation, setPlayAnimation] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1); // 1x, 2x, 4x, 8x

  // Generate mock temporal data
  const generateTemporalData = useCallback((range: [Date, Date]): TemporalDataPoint[] => {
    const [startDate, endDate] = range;
    const data: TemporalDataPoint[] = [];
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate data points (weekly for long periods, daily for short periods)
    const interval = daysDiff > 180 ? 7 : daysDiff > 30 ? 3 : 1;
    
    for (let i = 0; i <= daysDiff; i += interval) {
      const date = addDays(startDate, i);
      const dayOfYear = Math.floor((date.getTime() - startOfYear(date).getTime()) / (1000 * 60 * 60 * 24));
      
      // Seasonal NDVI variation
      const seasonalNdvi = 0.5 + 0.3 * Math.sin((dayOfYear / 365) * 2 * Math.PI);
      const noise = (Math.random() - 0.5) * 0.2;
      const ndvi = Math.max(0.1, Math.min(1.0, seasonalNdvi + noise));
      
      // Weather patterns
      const temperature = 25 + 10 * Math.sin((dayOfYear / 365) * 2 * Math.PI) + (Math.random() - 0.5) * 10;
      const precipitation = Math.max(0, Math.random() * 15);
      const humidity = 50 + 30 * Math.sin((dayOfYear / 365) * 2 * Math.PI + Math.PI) + (Math.random() - 0.5) * 20;
      
      // Soil moisture correlates with precipitation and season
      const soilMoisture = Math.max(20, Math.min(80, 50 + precipitation * 2 + humidity * 0.3 + (Math.random() - 0.5) * 15));
      
      data.push({
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
      });
    }
    
    return data;
  }, []);

  // Load temporal data when date range changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      const timer = setTimeout(() => {
        const data = generateTemporalData(dateRange);
        setTemporalData(data);
        setIsLoading(false);
      }, 300);
      
      return () => clearTimeout(timer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados temporais');
      setIsLoading(false);
    }
  }, [dateRange, generateTemporalData]);

  // Animation logic
  useEffect(() => {
    if (!playAnimation || temporalData.length === 0) return;

    const interval = 1000 / animationSpeed; // Base interval adjusted by speed
    const timer = setInterval(() => {
      setCurrentDate(prevDate => {
        const currentIndex = temporalData.findIndex(
          point => format(point.date, 'yyyy-MM-dd') === format(prevDate, 'yyyy-MM-dd')
        );
        
        if (currentIndex < temporalData.length - 1) {
          return temporalData[currentIndex + 1].date;
        } else {
          // Loop back to start
          setPlayAnimation(false);
          return temporalData[0].date;
        }
      });
    }, interval);

    return () => clearInterval(timer);
  }, [playAnimation, animationSpeed, temporalData]);

  const jumpToPreset = useCallback((preset: 'week' | 'month' | 'season' | 'year') => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (preset) {
      case 'week':
        startDate = subDays(today, 7);
        break;
      case 'month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'season':
        startDate = subDays(today, 90);
        break;
      case 'year':
        startDate = startOfYear(today);
        endDate = endOfYear(today);
        break;
    }

    setDateRange([startDate, endDate]);
    setCurrentDate(endDate);
  }, []);

  const nextDate = useCallback(() => {
    if (temporalData.length === 0) return;
    
    const currentIndex = temporalData.findIndex(
      point => format(point.date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
    );
    
    if (currentIndex < temporalData.length - 1) {
      setCurrentDate(temporalData[currentIndex + 1].date);
    }
  }, [currentDate, temporalData]);

  const previousDate = useCallback(() => {
    if (temporalData.length === 0) return;
    
    const currentIndex = temporalData.findIndex(
      point => format(point.date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
    );
    
    if (currentIndex > 0) {
      setCurrentDate(temporalData[currentIndex - 1].date);
    }
  }, [currentDate, temporalData]);

  const resetToToday = useCallback(() => {
    setCurrentDate(new Date());
    setPlayAnimation(false);
  }, []);

  return {
    currentDate,
    dateRange,
    temporalData,
    isLoading,
    error,
    setCurrentDate,
    setDateRange,
    playAnimation,
    setPlayAnimation,
    animationSpeed,
    setAnimationSpeed,
    jumpToPreset,
    nextDate,
    previousDate,
    resetToToday,
  };
};