import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMapLayers, LegendConfig } from '@/hooks/useMapLayers';
import { cn } from '@/lib/utils';

interface DynamicLegendProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const DynamicLegend: React.FC<DynamicLegendProps> = ({ 
  className,
  position = 'bottom-left' 
}) => {
  const { getActiveLegends } = useMapLayers();
  const activeLegends = getActiveLegends();

  if (activeLegends.length === 0) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const LegendItem: React.FC<{ 
    layerId: string; 
    layerName: string; 
    legend: LegendConfig 
  }> = ({ layerId, layerName, legend }) => {
    
    const renderGradientLegend = () => (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span>{legend.min}</span>
          <span className="text-muted-foreground">{legend.unit}</span>
          <span>{legend.max}</span>
        </div>
        <div className="relative h-4 rounded-full overflow-hidden">
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(to right, ${legend.colorMap.map(item => item.color).join(', ')})`
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-1">
          {legend.colorMap.slice(0, 4).map((item, index) => (
            <div key={index} className="flex items-center space-x-1">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground truncate">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );

    const renderDiscreteLegend = () => (
      <div className="space-y-2">
        {legend.colorMap.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded border border-border/30"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs flex-1">{item.label}</span>
            <span className="text-xs text-muted-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    );

    const renderNumericLegend = () => (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span>Min: {legend.min}</span>
          <Badge variant="outline" className="text-xs">
            {legend.unit}
          </Badge>
          <span>Max: {legend.max}</span>
        </div>
        
        <Progress 
          value={50} 
          className="h-2"
          style={{
            background: `linear-gradient(to right, ${legend.colorMap[0]?.color}, ${legend.colorMap[legend.colorMap.length - 1]?.color})`
          }}
        />
        
        <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
          <span>Baixo</span>
          <span className="text-center">Médio</span>
          <span className="text-right">Alto</span>
        </div>
      </div>
    );

    return (
      <div className="space-y-3 p-3 border border-border/30 rounded-lg bg-background/50">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">{layerName}</h4>
          <div 
            className="w-3 h-3 rounded-full border border-border/50"
            style={{ 
              backgroundColor: legend.colorMap[Math.floor(legend.colorMap.length / 2)]?.color 
            }}
          />
        </div>
        
        {legend.type === 'gradient' && renderGradientLegend()}
        {legend.type === 'discrete' && renderDiscreteLegend()}
        {legend.type === 'numeric' && renderNumericLegend()}
      </div>
    );
  };

  return (
    <div className={cn(
      "fixed z-20 max-w-xs",
      positionClasses[position],
      className
    )}>
      <Card className="bg-background/95 backdrop-blur-sm border-border/50 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            Legendas Ativas
            <Badge variant="secondary" className="text-xs">
              {activeLegends.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {activeLegends.map(({ layerId, layerName, legend }) => (
            <LegendItem
              key={layerId}
              layerId={layerId}
              layerName={layerName}
              legend={legend}
            />
          ))}
          
          <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
            Clique no mapa para valores específicos
          </div>
        </CardContent>
      </Card>
    </div>
  );
};