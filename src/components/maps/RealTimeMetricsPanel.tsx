import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Activity,
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Gauge,
  TestTube,
  Leaf,
  AlertTriangle,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useRealTimeMetrics } from '@/hooks/useRealTimeMetrics';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const {
    metrics,
    isLoading,
    error,
    lastUpdated,
    refreshNow,
    isAutoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval
  } = useRealTimeMetrics();

  const [showSettings, setShowSettings] = React.useState(false);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="w-3 h-3 text-red-500" />;
      case 'stable':
        return <Minus className="w-3 h-3 text-gray-500" />;
    }
  };

  const getAlertColor = (severity: 'low' | 'medium' | 'high' | 'critical') => {
    switch (severity) {
      case 'low': return 'bg-blue-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStressLevelColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
    }
  };

  if (!metrics && !isLoading) return null;

  return (
    <Card className={`absolute z-40 w-80 shadow-lg ${positionClasses[position]} ${className}`}>
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
              onClick={() => setAutoRefresh(!isAutoRefresh)}
              className="h-6 w-6 p-0"
            >
              {isAutoRefresh ? (
                <Eye className="w-3 h-3 text-green-500" />
              ) : (
                <EyeOff className="w-3 h-3 text-gray-400" />
              )}
            </Button>
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
        
        {lastUpdated && (
          <div className="text-xs text-muted-foreground">
            Última atualização: {format(lastUpdated, 'HH:mm:ss', { locale: ptBR })}
          </div>
        )}
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-destructive text-sm text-center py-2">
              {error}
            </div>
          ) : metrics ? (
            <>
              {/* NDVI Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium">NDVI</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-mono">
                      {metrics.ndvi.current.toFixed(3)}
                    </span>
                    {getTrendIcon(metrics.ndvi.trend)}
                  </div>
                </div>
                {metrics.ndvi.change !== 0 && (
                  <div className="text-xs text-muted-foreground">
                    Variação: {metrics.ndvi.change > 0 ? '+' : ''}{metrics.ndvi.change.toFixed(3)}
                  </div>
                )}
              </div>

              <Separator />

              {/* Weather Section */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Clima</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-3 h-3 text-orange-500" />
                    <span>{metrics.weather.temperature}°C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="w-3 h-3 text-blue-500" />
                    <span>{metrics.weather.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="w-3 h-3 text-gray-500" />
                    <span>{metrics.weather.windSpeed} km/h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-3 h-3 text-blue-600" />
                    <span>{metrics.weather.precipitation}mm</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Gauge className="w-3 h-3 text-gray-600" />
                  <span>Pressão: {metrics.weather.pressure} hPa</span>
                </div>
              </div>

              <Separator />

              {/* Soil Section */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Solo</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span>Umidade:</span>
                    <span className="font-mono">{metrics.soil.moisture}%</span>
                  </div>
                  <Progress value={metrics.soil.moisture} className="h-1" />
                  
                  <div className="flex justify-between">
                    <span>Temperatura:</span>
                    <span className="font-mono">{metrics.soil.temperature}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>pH:</span>
                    <span className="font-mono">{metrics.soil.ph}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Condutividade:</span>
                    <span className="font-mono">{metrics.soil.conductivity} µS/cm</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Growth Metrics */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Crescimento</div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-3 h-3 text-green-600" />
                    <span>{metrics.growthMetrics.stage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Próximo estágio:</span>
                    <span className="font-mono">{metrics.growthMetrics.daysToNextStage} dias</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Saúde:</span>
                    <span className={`font-mono ${getHealthScoreColor(metrics.growthMetrics.healthScore)}`}>
                      {metrics.growthMetrics.healthScore}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Stress:</span>
                    <Badge className={`text-xs ${getStressLevelColor(metrics.growthMetrics.stressLevel)}`}>
                      {metrics.growthMetrics.stressLevel}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Alerts Section */}
              {metrics.alerts.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-muted-foreground">Alertas</span>
                      <Badge variant="secondary" className="text-xs">
                        {metrics.alerts.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {metrics.alerts.slice(0, 3).map((alert) => (
                        <div key={alert.id} className="flex items-start gap-2 text-xs">
                          <div className={`w-2 h-2 rounded-full mt-1 ${getAlertColor(alert.severity)}`} />
                          <span className="flex-1">{alert.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
};