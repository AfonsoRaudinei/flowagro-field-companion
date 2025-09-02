import React, { useState } from 'react';
import { 
  Layers, 
  Satellite, 
  Map as MapIcon,
  Leaf,
  CloudRain,
  Zap,
  Eye,
  EyeOff,
  Settings,
  Mountain,
  Bug,
  Droplets,
  Sprout
} from 'lucide-react';
import { PremiumButton } from '@/components/ui/premium-button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePremiumMapAnimations } from '@/hooks/usePremiumMapAnimations';
import { useMapLayers } from '@/hooks/useMapLayers';
import { LayerPresets } from './LayerPresets';
import { DynamicLegend } from './DynamicLegend';

const LAYER_ICONS = {
  'Satellite': Satellite,
  'Leaf': Leaf,
  'CloudRain': CloudRain,
  'Zap': Zap,
  'Mountain': Mountain,
  'Bug': Bug,
  'Droplets': Droplets,
  'Sprout': Sprout,
  'Map': MapIcon
};

export const FloatingLayerSelector: React.FC = () => {
  const { getControlPosition, getZIndex, showControls } = usePremiumMapAnimations();
  const { 
    layers, 
    toggleLayer, 
    updateOpacity, 
    getLayersByCategory,
    getEnabledLayers,
    isLoading,
    error 
  } = useMapLayers();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('layers');

  const enabledCount = getEnabledLayers().length;
  const categories = ['base', 'agriculture', 'weather', 'analysis'] as const;

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
      <div className="relative">
        <PremiumButton
          variant={isExpanded ? "premium" : "outline"}
          size="icon"
          animation="glow"
          onClick={() => setIsExpanded(!isExpanded)}
          ariaLabel="Seletor de camadas"
          className="h-12 w-12 premium-icon"
          disabled={isLoading}
        >
          <Layers className={cn("h-5 w-5", isLoading && "animate-spin")} />
        </PremiumButton>
        
        {enabledCount > 0 && (
          <Badge 
            className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center"
            variant="default"
          >
            {enabledCount}
          </Badge>
        )}
      </div>

      {/* Expanded Layer Panel */}
      {isExpanded && (
        <Card className={cn(
          "absolute right-0 top-16 w-96 max-h-[70vh] overflow-hidden",
          "bg-background/95 backdrop-blur-sm",
          "border border-border/50 shadow-lg",
          "animate-scale-in"
        )}>
          <div className="flex items-center justify-between p-4 pb-2">
            <h3 className="font-semibold flex items-center space-x-2">
              <Layers className="h-4 w-4" />
              <span>Controle de Camadas</span>
            </h3>
            <PremiumButton
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(false)}
              ariaLabel="Fechar"
              className="h-8 w-8"
            >
              ×
            </PremiumButton>
          </div>

          {error && (
            <div className="mx-4 mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
              {error}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="layers" className="text-xs">
                  <Layers className="h-3 w-3 mr-1" />
                  Camadas
                </TabsTrigger>
                <TabsTrigger value="presets" className="text-xs">
                  <Settings className="h-3 w-3 mr-1" />
                  Presets
                </TabsTrigger>
                <TabsTrigger value="legend" className="text-xs">
                  <MapIcon className="h-3 w-3 mr-1" />
                  Legenda
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="max-h-[50vh] overflow-y-auto px-4 pb-4">
              <TabsContent value="layers" className="space-y-4 mt-4">
                {categories.map(category => {
                  const categoryLayers = getLayersByCategory(category);
                  if (categoryLayers.length === 0) return null;

                  const categoryNames = {
                    base: 'Mapas Base',
                    agriculture: 'Agricultura',
                    weather: 'Meteorologia', 
                    analysis: 'Análise'
                  };

                  return (
                    <div key={category}>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        {categoryNames[category]}
                      </h4>
                      <div className="space-y-2">
                        {categoryLayers.map((layer) => {
                          const IconComponent = LAYER_ICONS[layer.icon as keyof typeof LAYER_ICONS] || MapIcon;
                          
                          return (
                            <div
                              key={layer.id}
                              className={cn(
                                "space-y-3 p-3 rounded-lg border transition-all duration-200",
                                layer.enabled 
                                  ? "bg-primary/5 border-primary/20 shadow-sm" 
                                  : "bg-muted/30 border-border/30 hover:bg-muted/50"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 flex-1">
                                  <IconComponent className={cn(
                                    "h-4 w-4",
                                    layer.enabled ? "text-primary" : "text-muted-foreground"
                                  )} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <span className={cn(
                                        "text-sm font-medium truncate",
                                        layer.enabled ? "text-foreground" : "text-muted-foreground"
                                      )}>
                                        {layer.name}
                                      </span>
                                      {layer.premium && (
                                        <Badge variant="secondary" className="text-xs">
                                          PRO
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {layer.description}
                                    </p>
                                  </div>
                                </div>
                                
                                <PremiumButton
                                  variant="ghost"
                                  size="icon"
                                  animation="hover"
                                  onClick={() => toggleLayer(layer.id)}
                                  ariaLabel={`${layer.enabled ? 'Desativar' : 'Ativar'} camada ${layer.name}`}
                                  className="h-8 w-8 flex-shrink-0"
                                >
                                  {layer.enabled ? (
                                    <Eye className="h-3 w-3" />
                                  ) : (
                                    <EyeOff className="h-3 w-3" />
                                  )}
                                </PremiumButton>
                              </div>

                              {layer.enabled && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Opacidade</span>
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
                      </div>
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="presets" className="mt-4">
                <LayerPresets />
              </TabsContent>

              <TabsContent value="legend" className="mt-4">
                <div className="text-sm text-muted-foreground text-center py-8">
                  As legendas aparecem automaticamente no mapa quando camadas com dados são ativadas
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      )}
      
      {/* Dynamic Legend Component */}
      <DynamicLegend position="bottom-left" />
    </div>
  );
};