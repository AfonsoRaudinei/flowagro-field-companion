import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useToast } from '@/hooks/use-toast';
import { DevOnly, DebugInfo } from '@/lib/developmentUtils';
import { performanceMonitor, intelligentMetrics } from '@/lib/unifiedPerformance';
import { optimizedHealthMonitor } from '@/lib/optimizedHealthCheck';
import { Camera, Layers, Target, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface TechnicalOverlayProps {
  onStyleChange: (style: 'satellite' | 'terrain' | 'streets') => void;
  onLocationUpdate: (location: [number, number]) => void;
}

export const TechnicalOverlay: React.FC<TechnicalOverlayProps> = ({
  onStyleChange,
  onLocationUpdate
}) => {
  const { toast } = useToast();
  const userLocation = useUserLocation();
  const [currentStyle, setCurrentStyle] = useState<'satellite' | 'terrain' | 'streets'>('satellite');
  const [showMetrics, setShowMetrics] = useState(false);

  // Performance monitoring initialization
  useEffect(() => {
    const startTime = performance.now();
    
    if (import.meta.env.DEV) {
      logger.debug('Technical Overlay: Intelligent Metrics Profile', { 
        profile: intelligentMetrics.getDeviceProfile() 
      });
      logger.debug('Technical Overlay: Sampling Rate', { 
        rate: intelligentMetrics.getSamplingRate() 
      });
    }
    
    return () => {
      const loadTime = performance.now() - startTime;
      performanceMonitor.measure('technical-overlay-lifecycle', () => {
        intelligentMetrics.addMetric({
          name: 'overlay_load_time',
          value: loadTime,
          unit: 'ms',
          tags: { overlay: 'technical' }
        });
      });
    };
  }, []);

  const handleLocationClick = async () => {
    try {
      await userLocation.centerOnLocation();
      if (userLocation.currentPosition) {
        const coords: [number, number] = [
          userLocation.currentPosition.longitude,
          userLocation.currentPosition.latitude
        ];
        onLocationUpdate(coords);
      }
      toast({
        title: "📍 Localização encontrada",
        description: "Mapa centralizado na sua posição atual"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro de localização";
      toast({
        title: "❌ Erro de localização", 
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleStyleChange = (style: 'satellite' | 'terrain' | 'streets') => {
    setCurrentStyle(style);
    onStyleChange(style);
    toast({
      title: "Estilo alterado",
      description: `Visualização alterada para ${style}`
    });
  };

  return (
    <>
      {/* Tools Panel */}
      <Card className="absolute top-4 left-4 z-10 w-64">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <PenTool className="w-4 h-4" />
            Ferramentas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStyleChange("satellite")}
              className={cn(currentStyle === "satellite" && "bg-primary text-primary-foreground")}
            >
              <Layers className="w-4 h-4 mr-1" />
              Satélite
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStyleChange("terrain")}
              className={cn(currentStyle === "terrain" && "bg-primary text-primary-foreground")}
            >
              <Layers className="w-4 h-4 mr-1" />
              Terreno
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleLocationClick}
            className="w-full"
          >
            <Target className="w-4 h-4 mr-2" />
            Minha Localização
          </Button>

          {/* Development metrics toggle */}
          <DevOnly>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMetrics(!showMetrics)}
              className="w-full"
            >
              Métricas: {showMetrics ? 'ON' : 'OFF'}
            </Button>
          </DevOnly>
        </CardContent>
      </Card>

      {/* Location Footer */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <Card className="p-2">
          <CardContent className="p-2">
            <div className="flex items-center justify-between text-xs">
              <span>GPS: {userLocation.currentPosition ? 'Ativo' : 'Inativo'}</span>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleLocationClick}
                className="h-6 text-xs"
              >
                <Target className="w-3 h-3 mr-1" />
                Localizar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Development Debug Panel */}
      <DevOnly>
        {showMetrics && (
          <Card className="absolute top-4 right-4 z-10 max-w-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Métricas Técnicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <strong>Device Profile:</strong>
                  <pre className="mt-1 p-2 bg-muted rounded text-[10px]">
                    {JSON.stringify(intelligentMetrics.getDeviceProfile(), null, 2)}
                  </pre>
                </div>
                <div>
                  <strong>Sampling Rate:</strong> {(intelligentMetrics.getSamplingRate() * 100).toFixed(2)}%
                </div>
                <div>
                  <strong>Health Status:</strong>
                  <pre className="mt-1 p-2 bg-muted rounded text-[10px]">
                    {JSON.stringify(optimizedHealthMonitor.getStatus(), null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <DebugInfo 
          data={{
            currentStyle,
            userLocation: userLocation.currentPosition,
            intelligentMetrics: {
              deviceProfile: intelligentMetrics.getDeviceProfile(),
              samplingRate: intelligentMetrics.getSamplingRate()
            },
            healthStatus: optimizedHealthMonitor.getStatus()
          }}
          title="Technical Overlay Debug"
        />
      </DevOnly>
    </>
  );
};