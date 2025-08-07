import React, { useState } from 'react';
import { Calendar, Layers, Satellite, TrendingUp, Leaf, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LayerOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  source: 'sentinel' | 'planet' | 'base';
  requiresDate?: boolean;
}

interface SatelliteLayerSelectorProps {
  onLayerChange: (layerId: string, options?: any) => void;
  currentLayer: string;
  onClose: () => void;
}

const SatelliteLayerSelector: React.FC<SatelliteLayerSelectorProps> = ({
  onLayerChange,
  currentLayer,
  onClose
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const baseLayers: LayerOption[] = [
    {
      id: 'satellite',
      name: 'Satélite',
      description: 'Imagem de satélite padrão',
      icon: Satellite,
      color: 'bg-blue-500',
      source: 'base'
    },
    {
      id: 'hybrid',
      name: 'Híbrido',
      description: 'Satélite com rótulos',
      icon: Layers,
      color: 'bg-green-500',
      source: 'base'
    },
    {
      id: 'terrain',
      name: 'Terreno',
      description: 'Visualização topográfica',
      icon: TrendingUp,
      color: 'bg-amber-500',
      source: 'base'
    }
  ];

  const monitoringLayers: LayerOption[] = [
    {
      id: 'ndvi-sentinel',
      name: 'NDVI Sentinel',
      description: 'Índice de vegetação (Sentinel-2)',
      icon: Leaf,
      color: 'bg-green-600',
      source: 'sentinel',
      requiresDate: true
    },
    {
      id: 'ndvi-planet',
      name: 'NDVI Planet',
      description: 'Índice de vegetação (Planet Labs)',
      icon: Leaf,
      color: 'bg-emerald-600',
      source: 'planet',
      requiresDate: true
    },
    {
      id: 'biomassa',
      name: 'Biomassa',
      description: 'Estimativa de biomassa vegetal',
      icon: Activity,
      color: 'bg-lime-600',
      source: 'sentinel',
      requiresDate: true
    },
    {
      id: 'estresse',
      name: 'Estresse',
      description: 'Detecção de estresse hídrico',
      icon: Activity,
      color: 'bg-red-600',
      source: 'sentinel',
      requiresDate: true
    }
  ];

  const vegetationLayers: LayerOption[] = [
    {
      id: 'vigor-vegetativo',
      name: 'Vigor Vegetativo',
      description: 'Análise de vigor da vegetação',
      icon: TrendingUp,
      color: 'bg-green-700',
      source: 'sentinel',
      requiresDate: true
    },
    {
      id: 'crescimento-historico',
      name: 'Crescimento Histórico',
      description: 'Evolução temporal da vegetação',
      icon: TrendingUp,
      color: 'bg-blue-700',
      source: 'sentinel',
      requiresDate: true
    },
    {
      id: 'fase-fenologica',
      name: 'Fase Fenológica',
      description: 'Identificação de estágio da cultura',
      icon: Leaf,
      color: 'bg-purple-600',
      source: 'sentinel',
      requiresDate: true
    }
  ];

  const handleLayerSelect = (layer: LayerOption) => {
    const options = layer.requiresDate ? { date: selectedDate } : undefined;
    onLayerChange(layer.id, options);
    onClose();
  };

  const LayerButton: React.FC<{ layer: LayerOption }> = ({ layer }) => {
    const Icon = layer.icon;
    const isSelected = currentLayer === layer.id;

    return (
      <Button
        variant={isSelected ? "default" : "outline"}
        className={cn(
          "w-full justify-start h-auto p-3 mb-2",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={() => handleLayerSelect(layer)}
      >
        <div className="flex items-center space-x-3 w-full">
          <div className={cn("w-3 h-3 rounded-full", layer.color)} />
          <Icon className="h-4 w-4" />
          <div className="flex-1 text-left">
            <div className="font-medium text-sm">{layer.name}</div>
            <div className="text-xs text-muted-foreground">{layer.description}</div>
          </div>
          {layer.requiresDate && (
            <Badge variant="secondary" className="text-xs">
              {layer.source === 'sentinel' ? 'S2' : 'PL'}
            </Badge>
          )}
        </div>
      </Button>
    );
  };

  return (
    <Card className="bg-card/95 backdrop-blur-sm border border-border shadow-lg w-80">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center">
            <Layers className="h-4 w-4 mr-2" />
            Camadas de Satélite
          </h3>
          
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {format(selectedDate, 'dd/MM', { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setShowDatePicker(false);
                  }
                }}
                disabled={(date) => date > new Date() || date < new Date('2015-01-01')}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <Tabs defaultValue="base" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="base" className="text-xs">Base</TabsTrigger>
            <TabsTrigger value="monitoring" className="text-xs">Monitoramento</TabsTrigger>
            <TabsTrigger value="vegetation" className="text-xs">Vegetação</TabsTrigger>
          </TabsList>

          <TabsContent value="base" className="mt-0">
            <div className="space-y-1">
              {baseLayers.map((layer) => (
                <LayerButton key={layer.id} layer={layer} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="mt-0">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground mb-2 px-1">
                Data selecionada: {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
              </div>
              {monitoringLayers.map((layer) => (
                <LayerButton key={layer.id} layer={layer} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vegetation" className="mt-0">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground mb-2 px-1">
                Data selecionada: {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
              </div>
              {vegetationLayers.map((layer) => (
                <LayerButton key={layer.id} layer={layer} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2">Legendas:</div>
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-600 rounded-full" />
              <span>Alto</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span>Médio</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>Baixo</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SatelliteLayerSelector;