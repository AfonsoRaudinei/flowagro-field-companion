import React, { useEffect, useState } from 'react';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Battery, 
  Cpu, 
  MemoryStick, 
  Gauge, 
  Wifi, 
  WifiOff,
  Settings,
  Smartphone,
  Monitor
} from 'lucide-react';

interface MobileRenderOptimizerProps {
  showDebugPanel?: boolean;
  autoOptimize?: boolean;
  className?: string;
}

/**
 * Component that provides mobile rendering optimization with visual feedback
 */
export const MobileRenderOptimizer: React.FC<MobileRenderOptimizerProps> = ({
  showDebugPanel = false,
  autoOptimize = true,
  className = ''
}) => {
  const { status, deviceCapabilities, optimize, config } = useMobileOptimization({
    enableGPUAcceleration: true,
    adaptiveQuality: autoOptimize,
    batteryOptimization: true,
    touchOptimization: true,
    memoryManagement: true,
    frameRateTarget: 60
  });

  const [showOptimizationSuggestion, setShowOptimizationSuggestion] = useState(false);

  // Show optimization suggestion when performance drops
  useEffect(() => {
    const shouldSuggest = (
      status.currentFPS < config.frameRateTarget * 0.8 ||
      status.memoryUsage > 75 ||
      status.batteryLevel < 20
    ) && !status.isOptimized;

    setShowOptimizationSuggestion(shouldSuggest);
  }, [status, config.frameRateTarget]);

  // Auto-optimize when enabled
  useEffect(() => {
    if (autoOptimize && showOptimizationSuggestion) {
      optimize();
      setShowOptimizationSuggestion(false);
    }
  }, [autoOptimize, showOptimizationSuggestion, optimize]);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getBatteryColor = (level: number) => {
    if (level >= 50) return 'text-green-500';
    if (level >= 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getNetworkIcon = (speed: string) => {
    return speed === 'offline' ? WifiOff : Wifi;
  };

  // Optimization suggestion popup
  if (showOptimizationSuggestion && !autoOptimize) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${className}`}>
        <Card className="p-6 max-w-md mx-4 bg-background border-primary/20">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Otimização Recomendada</h3>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Detectamos que o desempenho pode ser melhorado:</p>
              
              <ul className="space-y-1 list-disc list-inside">
                {status.currentFPS < config.frameRateTarget * 0.8 && (
                  <li>FPS baixo detectado ({Math.round(status.currentFPS)} fps)</li>
                )}
                {status.memoryUsage > 75 && (
                  <li>Alto uso de memória ({Math.round(status.memoryUsage)}%)</li>
                )}
                {status.batteryLevel < 20 && (
                  <li>Bateria baixa ({Math.round(status.batteryLevel)}%)</li>
                )}
              </ul>
            </div>

            <div className="flex gap-2">
              <Button onClick={optimize} className="flex-1">
                <Zap className="h-4 w-4 mr-2" />
                Otimizar Agora
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowOptimizationSuggestion(false)}
              >
                Ignorar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Status indicators (always visible when optimized)
  if (status.isOptimized && !showDebugPanel) {
    return (
      <div className={`fixed top-4 left-4 z-40 space-y-2 ${className}`}>
        {/* Quality indicator */}
        <Badge 
          variant="outline" 
          className={`${getQualityColor(status.qualityLevel)} text-white border-0`}
        >
          <Gauge className="h-3 w-3 mr-1" />
          {status.qualityLevel}
        </Badge>

        {/* Performance warning */}
        {(status.currentFPS < config.frameRateTarget * 0.8 || status.memoryUsage > 80) && (
          <Badge variant="destructive" className="gap-1">
            <Zap className="h-3 w-3" />
            Performance
          </Badge>
        )}
      </div>
    );
  }

  // Full debug panel
  if (showDebugPanel) {
    return (
      <div className={`fixed top-4 left-4 z-40 ${className}`}>
        <Card className="p-4 bg-background/95 backdrop-blur-sm border-primary/20">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Otimização Mobile</span>
              </div>
              
              {deviceCapabilities && (
                <Badge variant="outline" className="text-xs">
                  {deviceCapabilities.isMobile ? 'Mobile' : 'Desktop'}
                </Badge>
              )}
            </div>

            {/* Performance metrics */}
            <div className="space-y-2">
              {/* FPS */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Gauge className="h-3 w-3" />
                  <span>FPS:</span>
                </div>
                <span className={getFPSColor(status.currentFPS)}>
                  {Math.round(status.currentFPS)}
                </span>
              </div>

              {/* Memory */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <MemoryStick className="h-3 w-3" />
                    <span>Memória:</span>
                  </div>
                  <span>{Math.round(status.memoryUsage)}%</span>
                </div>
                <Progress value={status.memoryUsage} className="h-1" />
              </div>

              {/* Battery */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Battery className="h-3 w-3" />
                    <span>Bateria:</span>
                  </div>
                  <span className={getBatteryColor(status.batteryLevel)}>
                    {Math.round(status.batteryLevel)}%
                  </span>
                </div>
                <Progress value={status.batteryLevel} className="h-1" />
              </div>

              {/* Network */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  {React.createElement(getNetworkIcon(status.networkSpeed), { className: "h-3 w-3" })}
                  <span>Rede:</span>
                </div>
                <span className="capitalize">{status.networkSpeed}</span>
              </div>
            </div>

            {/* Quality and device info */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getQualityColor(status.qualityLevel)} text-white border-0`}
                >
                  Qualidade: {status.qualityLevel}
                </Badge>
                
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={optimize}
                  className="h-6 px-2 text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Otimizar
                </Button>
              </div>

              {/* Device capabilities */}
              {deviceCapabilities && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div className="flex justify-between">
                    <span>CPU cores:</span>
                    <span>{deviceCapabilities.cores}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RAM:</span>
                    <span>{deviceCapabilities.memory}GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>WebGL:</span>
                    <span>v{deviceCapabilities.webGLVersion}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};