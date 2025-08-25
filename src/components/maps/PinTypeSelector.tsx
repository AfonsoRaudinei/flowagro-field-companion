import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MapPin, 
  Tractor, 
  Ruler, 
  Settings,
  Plus 
} from 'lucide-react';
import { MapPin as MapPinType } from '@/hooks/useMapPins';

interface PinTypeSelectorProps {
  selectedType: MapPinType['type'];
  onTypeSelect: (type: MapPinType['type']) => void;
  onCreatePin: () => void;
  counts: Record<string, number>;
}

const PIN_TYPES = [
  { 
    value: 'farm' as const, 
    label: 'Fazenda', 
    icon: Tractor, 
    description: 'Propriedades rurais',
    color: '#00C4B4' // FlowAgro Green
  },
  { 
    value: 'measurement' as const, 
    label: 'Medição', 
    icon: Ruler, 
    description: 'Pontos de medição',
    color: '#0057FF' // FlowAgro Blue
  },
  { 
    value: 'custom' as const, 
    label: 'Personalizado', 
    icon: Settings, 
    description: 'Pins personalizados',
    color: '#FF8800' // Orange
  },
  { 
    value: 'default' as const, 
    label: 'Padrão', 
    icon: MapPin, 
    description: 'Pins genéricos',
    color: '#8844FF' // Purple
  },
];

export const PinTypeSelector: React.FC<PinTypeSelectorProps> = ({
  selectedType,
  onTypeSelect,
  onCreatePin,
  counts,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tipos de Pin</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {PIN_TYPES.map((pinType) => {
            const Icon = pinType.icon;
            const isSelected = selectedType === pinType.value;
            const count = counts[pinType.value] || 0;
            
            return (
              <Button
                key={pinType.value}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onTypeSelect(pinType.value)}
                className={`h-auto p-3 rounded-xl flex-col space-y-1 relative ${
                  isSelected ? 'ring-2 ring-primary/20' : ''
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full border border-white/50"
                    style={{ backgroundColor: pinType.color }}
                  />
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xs font-medium">{pinType.label}</div>
                {count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full text-xs"
                  >
                    {count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
        
        <Button
          onClick={onCreatePin}
          className="w-full rounded-xl"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar {PIN_TYPES.find(t => t.value === selectedType)?.label}
        </Button>
        
        <div className="text-xs text-muted-foreground text-center">
          {selectedType === 'farm' && 'Marcar localização de fazendas e propriedades'}
          {selectedType === 'measurement' && 'Marcar pontos de coleta e medição'}
          {selectedType === 'custom' && 'Marcar locais personalizados'}
          {selectedType === 'default' && 'Marcar pontos de interesse geral'}
        </div>
      </CardContent>
    </Card>
  );
};