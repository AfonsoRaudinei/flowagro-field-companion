import React, { useState } from 'react';
import { 
  Layers, 
  Satellite, 
  Map as MapIcon,
  Leaf,
  CloudRain,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import { PremiumButton } from '@/components/ui/premium-button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { usePremiumMapAnimations } from '@/hooks/usePremiumMapAnimations';

interface LayerConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  opacity: number;
  premium?: boolean;
}

export const FloatingLayerSelector: React.FC = () => {
  const { getControlPosition, getZIndex, showControls } = usePremiumMapAnimations();
  const [isExpanded, setIsExpanded] = useState(false);
  const [layers, setLayers] = useState<LayerConfig[]>([
    { id: 'satellite', name: 'Satélite', icon: Satellite, enabled: true, opacity: 100 },
    { id: 'ndvi', name: 'NDVI', icon: Leaf, enabled: false, opacity: 75, premium: true },
    { id: 'weather', name: 'Clima', icon: CloudRain, enabled: false, opacity: 85, premium: true },
    { id: 'zones', name: 'Zonas', icon: Zap, enabled: false, opacity: 90, premium: true },
  ]);

  const toggleLayer = (layerId: string) => {
    setLayers(prev => 
      prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, enabled: !layer.enabled }
          : layer
      )
    );
  };

  const updateOpacity = (layerId: string, opacity: number) => {
    setLayers(prev => 
      prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, opacity }
          : layer
      )
    );
  };

  const controlPosition = getControlPosition('secondary');

  return (
    <div
      className={cn(
        "fixed z-30",
        controlPosition.secondary,
        "transition-all duration-300",
        !showControls && "opacity-0 pointer-events-none"
      )}
      style={{ zIndex: getZIndex('controls') }}
    >
      {/* Main Toggle Button */}
      <PremiumButton
        variant={isExpanded ? "premium" : "outline"}
        size="icon"
        animation="glow"
        onClick={() => setIsExpanded(!isExpanded)}
        ariaLabel="Seletor de camadas"
        className="h-12 w-12 premium-icon"
      >
        <Layers className="h-5 w-5" />
      </PremiumButton>

      {/* Expanded Layer Panel */}
      {isExpanded && (
        <Card className={cn(
          "absolute right-0 top-14 w-80",
          "bg-background/95 backdrop-blur-sm",
          "border border-border/50 shadow-lg",
          "animate-scale-in"
        )}>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Camadas do Mapa</h3>
              <PremiumButton
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                ariaLabel="Fechar"
              >
                ×
              </PremiumButton>
            </div>

            {layers.map((layer) => {
              const IconComponent = layer.icon;
              
              return (
                <div
                  key={layer.id}
                  className={cn(
                    "space-y-3 p-3 rounded-lg border",
                    layer.enabled 
                      ? "bg-primary/5 border-primary/20" 
                      : "bg-muted/30 border-border/30"
                  )}
                >
                  {/* Layer Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <IconComponent className={cn(
                        "h-4 w-4",
                        layer.enabled ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        layer.enabled ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {layer.name}
                      </span>
                      {layer.premium && (
                        <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                          PRO
                        </span>
                      )}
                    </div>
                    
                    <PremiumButton
                      variant="ghost"
                      size="icon"
                      animation="hover"
                      onClick={() => toggleLayer(layer.id)}
                      ariaLabel={`${layer.enabled ? 'Desativar' : 'Ativar'} camada ${layer.name}`}
                      className="h-8 w-8"
                    >
                      {layer.enabled ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                    </PremiumButton>
                  </div>

                  {/* Opacity Slider */}
                  {layer.enabled && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Transparência</span>
                        <span>{layer.opacity}%</span>
                      </div>
                      <Slider
                        value={[layer.opacity]}
                        onValueChange={([value]) => updateOpacity(layer.id, value)}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Quick Presets */}
            <div className="space-y-2 pt-2 border-t border-border/30">
              <h4 className="text-sm font-medium text-muted-foreground">Presets Rápidos</h4>
              <div className="grid grid-cols-2 gap-2">
                <PremiumButton
                  variant="outline"
                  size="sm"
                  animation="hover"
                  className="justify-start text-xs"
                >
                  <MapIcon className="h-3 w-3 mr-1" />
                  Base
                </PremiumButton>
                
                <PremiumButton
                  variant="outline"
                  size="sm"
                  animation="hover"
                  className="justify-start text-xs availability-pulse"
                >
                  <Leaf className="h-3 w-3 mr-1" />
                  Análise
                </PremiumButton>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};