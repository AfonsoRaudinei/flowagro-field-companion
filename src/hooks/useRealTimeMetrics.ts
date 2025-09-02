import { useState, useEffect, useCallback } from 'react';

interface RealTimeMetrics {
  ndvi: {
    current: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    change: number;
  };
  weather: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    pressure: number;
  };
  soil: {
    moisture: number;
    temperature: number;
    ph: number;
    conductivity: number;
  };
  alerts: Array<{
    id: string;
    type: 'weather' | 'pest' | 'disease' | 'soil' | 'irrigation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
  }>;
  growthMetrics: {
    stage: string;
    daysToNextStage: number;
    healthScore: number;
    stressLevel: 'low' | 'medium' | 'high';
  };
}

interface UseRealTimeMetricsReturn {
  metrics: RealTimeMetrics | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshInterval: number;
  setRefreshInterval: (minutes: number) => void;
  refreshNow: () => void;
  isAutoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
}

export const useRealTimeMetrics = (): UseRealTimeMetricsReturn => {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(15); // minutes
  const [isAutoRefresh, setAutoRefresh] = useState(true);

  const generateMockMetrics = useCallback((): RealTimeMetrics => {
    const currentNdvi = Math.random() * 0.6 + 0.3; // 0.3 to 0.9
    const previousNdvi = currentNdvi + (Math.random() - 0.5) * 0.1;
    const ndviChange = currentNdvi - previousNdvi;
    
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(ndviChange) < 0.02) {
      trend = 'stable';
    } else if (ndviChange > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    // Generate weather data
    const weather = {
      temperature: Math.round(Math.random() * 15 + 20), // 20-35°C
      humidity: Math.round(Math.random() * 40 + 40), // 40-80%
      windSpeed: Math.round(Math.random() * 20 + 5), // 5-25 km/h
      precipitation: Math.round(Math.random() * 10 * 100) / 100, // 0-10mm
      pressure: Math.round((Math.random() * 50 + 1000) * 10) / 10, // 1000-1050 hPa
    };

    // Generate soil data
    const soil = {
      moisture: Math.round(Math.random() * 50 + 30), // 30-80%
      temperature: Math.round(Math.random() * 10 + weather.temperature - 5), // Usually cooler than air
      ph: Math.round((Math.random() * 3 + 5.5) * 10) / 10, // 5.5-8.5
      conductivity: Math.round(Math.random() * 2000 + 500), // 500-2500 µS/cm
    };

    // Generate alerts
    const alertTypes = ['weather', 'pest', 'disease', 'soil', 'irrigation'] as const;
    const severities = ['low', 'medium', 'high', 'critical'] as const;
    const alertMessages = {
      weather: ['Chuva forte prevista', 'Temperatura muito alta', 'Vento forte detectado'],
      pest: ['Atividade de pragas detectada', 'Risco de lagarta aumentado'],
      disease: ['Condições favoráveis para fungos', 'Sintomas de doença identificados'],
      soil: ['Umidade do solo baixa', 'pH fora da faixa ideal'],
      irrigation: ['Sistema de irrigação offline', 'Pressão de água baixa'],
    };

    const numAlerts = Math.floor(Math.random() * 3); // 0-2 alerts
    const alerts = Array.from({ length: numAlerts }, (_, i) => {
      const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const messages = alertMessages[type];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      return {
        id: `alert-${Date.now()}-${i}`,
        type,
        severity,
        message,
        timestamp: new Date(Date.now() - Math.random() * 3600000), // Within last hour
      };
    });

    // Generate growth metrics
    const stages = ['Germinação', 'Desenvolvimento Vegetativo', 'Floração', 'Frutificação', 'Maturação'];
    const currentStageIndex = Math.floor(Math.random() * stages.length);
    const healthScore = Math.round((Math.random() * 40 + 60) * 10) / 10; // 60-100
    const stressLevels = ['low', 'medium', 'high'] as const;
    const stressLevel = stressLevels[Math.floor(Math.random() * stressLevels.length)];

    const growthMetrics = {
      stage: stages[currentStageIndex],
      daysToNextStage: Math.floor(Math.random() * 14 + 1), // 1-14 days
      healthScore,
      stressLevel,
    };

    return {
      ndvi: {
        current: Math.round(currentNdvi * 100) / 100,
        trend,
        change: Math.round(ndviChange * 1000) / 1000,
      },
      weather,
      soil,
      alerts,
      growthMetrics,
    };
  }, []);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newMetrics = generateMockMetrics();
      setMetrics(newMetrics);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar métricas');
    } finally {
      setIsLoading(false);
    }
  }, [generateMockMetrics]);

  const refreshNow = useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Initial load
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh logic
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, refreshInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(interval);
  }, [isAutoRefresh, refreshInterval, fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    lastUpdated,
    refreshInterval,
    setRefreshInterval,
    refreshNow,
    isAutoRefresh,
    setAutoRefresh,
  };
};