import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useRealTimeMetrics } from '@/hooks/useRealTimeMetrics';

interface RealTimeMetricsPanelProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export const RealTimeMetricsPanel = ({ 
  className,
  position = 'top-right',
  isCollapsed = false,
  onToggleCollapsed
}: RealTimeMetricsPanelProps) => {
  const { metrics, isLoading, error, refreshNow } = useRealTimeMetrics();

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  if (!metrics && !isLoading) return null;

  return (
    <Card className={`absolute z-40 w-80 shadow-lg ${positionClasses[position]} ${className || ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Métricas em Tempo Real
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshNow}
              disabled={isLoading}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            {onToggleCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapsed}
                className="h-6 w-6 p-0"
              >
                {isCollapsed ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronUp className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-destructive text-sm text-center py-2">{error}</div>
          ) : metrics ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">NDVI:</span>
                <span className="text-sm font-mono">{metrics.ndvi.current.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Temperatura:</span>
                <span className="text-sm font-mono">{metrics.weather.temperature}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Umidade:</span>
                <span className="text-sm font-mono">{metrics.weather.humidity}%</span>
              </div>
            </div>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
};