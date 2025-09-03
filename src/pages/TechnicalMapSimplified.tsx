import React, { useState, useEffect } from "react";
import { MapProvider } from "@/components/maps/MapProvider";
import { SimpleBaseMap } from "@/components/maps/SimpleBaseMap";
import { DrawingToolsPanel } from "@/components/maps/DrawingToolsPanel";
import { LocationTracker } from "@/components/maps/LocationTracker";
import { LocationFooter } from "@/components/maps/LocationFooter";
import { useMapDrawing } from "@/hooks/useMapDrawing";
import { useMapNavigation } from '@/hooks/useMapInstance';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useToast } from "@/hooks/use-toast";
import { getStyleUrl, type MapStyle } from '@/services/mapService';
import { DevOnly, DebugInfo } from '@/lib/developmentUtils';
import { performanceMonitor, intelligentMetrics } from '@/lib/unifiedPerformance';
import { optimizedHealthMonitor } from '@/lib/optimizedHealthCheck';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Layers, Target, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";

function TechnicalMapContent() {
  const { toast } = useToast();
  
  // Optimized hooks with fallbacks
  const mapDrawing = useMapDrawing();
  const userLocation = useUserLocation();
  
  // UI State
  const [currentStyle, setCurrentStyle] = useState<MapStyle>("satellite");
  const [showMetrics, setShowMetrics] = useState(false);

  // FASE 5: Performance monitoring initialization
  useEffect(() => {
    const startTime = performance.now();
    
    // Initialize intelligent metrics
    if (import.meta.env.DEV) {
      console.log('Intelligent Metrics Profile:', intelligentMetrics.getDeviceProfile());
      console.log('Sampling Rate:', intelligentMetrics.getSamplingRate());
      console.log('Health Monitor Status:', optimizedHealthMonitor.getStatus());
    }
    
    return () => {
      const loadTime = performance.now() - startTime;
      performanceMonitor.measure('technical-map-lifecycle', () => {
        intelligentMetrics.addMetric({
          name: 'page_load_time',
          value: loadTime,
          unit: 'ms',
          tags: { page: 'technical-map' }
        } as any);
      });
    };
  }, []);

  const handleLocationClick = async () => {
    try {
      await userLocation.centerOnLocation();
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

  const handleStyleChange = (style: MapStyle) => {
    setCurrentStyle(style);
    toast({
      title: "Estilo alterado",
      description: `Visualização alterada para ${style}`
    });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <SimpleBaseMap 
        style={getStyleUrl(currentStyle)}
        onLoad={() => {
          if (import.meta.env.DEV) {
            console.log('Map loaded successfully');
          }
        }}
      />
      
      {/* Core Components */}
      <LocationTracker />
      
      {/* Simplified Drawing Panel */}
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

          {/* FASE 5: Metrics toggle for development */}
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
      <LocationFooter 
        position={userLocation.currentPosition}
        accuracy={userLocation.accuracy}
        onLocationClick={handleLocationClick}
      />

      {/* FASE 5: Advanced Debug Panel - Only in Development */}
      <DevOnly>
        {showMetrics && (
          <Card className="absolute top-4 right-4 z-10 max-w-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">FASE 5 Metrics</CardTitle>
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
                  <strong>Health Monitor:</strong>
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
          title="FASE 5 Debug"
        />
      </DevOnly>
    </div>
  );
}

export default function TechnicalMap() {
  return (
    <MapProvider>
      <TechnicalMapContent />
    </MapProvider>
  );
}