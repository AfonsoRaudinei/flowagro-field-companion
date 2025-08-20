import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Cloud, 
  CloudOff 
} from 'lucide-react';
import { useNetworkSync } from '@/hooks/useNetworkSync';

interface UnifiedStatusProps {
  className?: string;
  compact?: boolean;
  showWeather?: boolean;
  weather?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    condition: string;
  };
  onClick?: () => void;
}

export const UnifiedStatus: React.FC<UnifiedStatusProps> = ({
  className = '',
  compact = false,
  showWeather = false,
  weather,
  onClick
}) => {
  const { 
    isOffline, 
    hasPendingData, 
    hasErrors, 
    syncStats, 
    isManualSyncing, 
    forceSync,
    isInitialized 
  } = useNetworkSync();

  if (!isInitialized) {
    return null;
  }

  const getSyncIcon = () => {
    if (isManualSyncing) return RefreshCw;
    if (hasErrors) return AlertCircle;
    if (hasPendingData) return Cloud;
    return CheckCircle;
  };

  const getSyncColor = () => {
    if (isManualSyncing) return 'text-blue-500';
    if (hasErrors) return 'text-red-500';
    if (hasPendingData) return 'text-orange-500';
    return 'text-green-500';
  };

  const getSyncTooltip = () => {
    if (isOffline) return 'Trabalhando offline - dados serão sincronizados quando houver conexão';
    if (isManualSyncing) return 'Sincronizando dados...';
    if (hasErrors) return `${syncStats.failed} erro${syncStats.failed > 1 ? 's' : ''} na sincronização`;
    if (hasPendingData) return `${syncStats.totalPending} ${syncStats.totalPending === 1 ? 'arquivo pendente' : 'arquivos pendentes'} para sincronização`;
    return 'Todos os dados estão sincronizados';
  };

  if (compact) {
    const SyncIcon = getSyncIcon();
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={forceSync}
              disabled={isOffline || isManualSyncing}
              variant="ghost"
              size="sm"
              className={`w-8 h-8 p-0 rounded-full shadow-sm border backdrop-blur-sm ${
                isOffline 
                  ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                  : hasErrors
                  ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                  : hasPendingData
                  ? 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800'
                  : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
              } hover:scale-105 transition-all duration-200 ${className}`}
            >
              <SyncIcon 
                className={`h-4 w-4 ${getSyncColor()} ${
                  isManualSyncing ? 'animate-spin' : ''
                }`} 
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-sm">{getSyncTooltip()}</p>
            {hasPendingData && !isOffline && (
              <p className="text-xs text-muted-foreground mt-1">
                Toque para sincronizar agora
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card 
      className={`bg-background/95 backdrop-blur-sm border shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between space-x-3">
          {/* Network Status */}
          <div className="flex items-center space-x-1">
            {isOffline ? (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <Badge variant="outline" className="text-xs border-red-500 text-red-500">
                  Offline
                </Badge>
              </>
            ) : (
              <Wifi className="w-4 h-4 text-green-500" />
            )}
          </div>

          {/* Sync Status */}
          <div className="flex items-center space-x-1">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                forceSync();
              }}
              disabled={isOffline || isManualSyncing}
              variant="ghost"
              size="sm"
              className="h-8 px-2"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isManualSyncing ? 'animate-spin' : ''}`} />
              {hasPendingData && <span className="text-xs">{syncStats.totalPending}</span>}
            </Button>
            
            {(hasPendingData || hasErrors) && (
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  hasErrors 
                    ? 'border-red-500 text-red-500' 
                    : 'border-blue-500 text-blue-500'
                }`}
              >
                {hasErrors ? (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {syncStats.failed} erro{syncStats.failed > 1 ? 's' : ''}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Pendente
                  </>
                )}
              </Badge>
            )}
          </div>

          {/* Weather (optional) */}
          {showWeather && weather && (
            <div className="flex items-center text-xs font-medium text-foreground">
              <span className="mr-1">{weather.condition}</span>
              <span>{weather.temperature}°C</span>
              <span className="mx-1">•</span>
              <span>{weather.humidity}%</span>
              <span className="mx-1">•</span>
              <span>{weather.windSpeed}km/h</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedStatus;