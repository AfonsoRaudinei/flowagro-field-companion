import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMeasurementTools } from '@/hooks/useMeasurementTools';
import { UnitService, UnitType } from '@/services/unitService';
import { 
  Ruler, 
  Square, 
  Circle,
  MousePointer,
  Play,
  Check,
  X,
  Trash2,
  Download,
  Settings,
  ChevronDown,
  MapPin,
  AreaChart,
  Zap
} from 'lucide-react';

interface MeasurementToolsPanelProps {
  className?: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
  onClose?: () => void;
}

const TOOL_CONFIGS = [
  {
    id: 'select' as const,
    name: 'Selecionar',
    icon: MousePointer,
    description: 'Modo de seleção padrão',
    color: 'hsl(var(--muted-foreground))'
  },
  {
    id: 'ruler' as const,
    name: 'Régua',
    icon: Ruler,
    description: 'Medir distâncias com precisão GPS',
    color: 'hsl(var(--orange))',
    shortcut: 'R'
  },
  {
    id: 'area' as const,
    name: 'Área',
    icon: Square,
    description: 'Medir área de polígonos',
    color: 'hsl(var(--green))',
    shortcut: 'A'
  },
  {
    id: 'perimeter' as const,
    name: 'Perímetro',
    icon: Circle,
    description: 'Medir perímetro e área',
    color: 'hsl(var(--blue))',
    shortcut: 'P'
  }
];

export const MeasurementToolsPanel: React.FC<MeasurementToolsPanelProps> = ({
  className = '',
  position = 'left',
  onClose
}) => {
  const {
    activeTool,
    isMeasuring,
    measurements,
    currentPoints,
    currentDistance,
    currentArea,
    setActiveTool,
    startMeasurement,
    finishMeasurement,
    cancelMeasurement,
    clearAllMeasurements,
    deleteMeasurement,
    preferredAreaUnit,
    setPreferredAreaUnit,
    snapToFieldEnabled,
    setSnapToFieldEnabled,
    exportMeasurements
  } = useMeasurementTools();

  const [showSettings, setShowSettings] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(true);

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(1)} m`;
  };

  const getToolConfig = (toolId: string) => {
    return TOOL_CONFIGS.find(t => t.id === toolId) || TOOL_CONFIGS[0];
  };

  const getCurrentMeasurementDisplay = () => {
    if (!isMeasuring || currentPoints.length === 0) return null;

    if (activeTool === 'ruler' && currentDistance !== null) {
      return (
        <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Ruler className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Medindo Distância</span>
          </div>
          <div className="text-lg font-bold text-orange-900">
            {formatDistance(currentDistance)}
          </div>
          <div className="text-xs text-orange-600 mt-1">
            {currentPoints.length} ponto{currentPoints.length !== 1 ? 's' : ''} • Clique duplo para finalizar
          </div>
        </div>
      );
    }

    if ((activeTool === 'area' || activeTool === 'perimeter') && currentArea !== null) {
      const area = UnitService.formatArea(currentArea.m2, preferredAreaUnit);
      return (
        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Square className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              {activeTool === 'area' ? 'Medindo Área' : 'Medindo Perímetro & Área'}
            </span>
          </div>
          <div className="text-lg font-bold text-green-900">
            {area}
          </div>
          <div className="text-xs text-green-600 mt-1">
            {currentPoints.length} ponto{currentPoints.length !== 1 ? 's' : ''} • Clique duplo para finalizar
          </div>
        </div>
      );
    }

    return null;
  };

  const totalMeasurements = measurements.distances.length + measurements.areas.length;

  return (
    <Card className={`${className} w-80`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Ruler className="w-5 h-5" />
            <span>Ferramentas de Medição</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{totalMeasurements}</Badge>
            {onClose && (
              <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tool Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Ferramentas</Label>
          <div className="grid grid-cols-2 gap-2">
            {TOOL_CONFIGS.map((tool) => {
              const isActive = activeTool === tool.id;
              const Icon = tool.icon;
              
              return (
                <Button
                  key={tool.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTool(tool.id)}
                  className={`h-12 flex-col space-y-1 p-2 ${
                    isActive ? '' : 'hover:border-primary/20'
                  }`}
                  disabled={isMeasuring && activeTool !== tool.id}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                  <span className={`text-xs ${isActive ? 'text-white' : ''}`}>
                    {tool.name}
                  </span>
                  {tool.shortcut && (
                    <span className={`text-[10px] opacity-60 ${isActive ? 'text-white' : ''}`}>
                      {tool.shortcut}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Tool Info */}
        {activeTool !== 'select' && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: getToolConfig(activeTool).color }}
              >
                {React.createElement(getToolConfig(activeTool).icon, {
                  className: 'w-4 h-4 text-white'
                })}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{getToolConfig(activeTool).name}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {getToolConfig(activeTool).description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Measurement Controls */}
        {activeTool !== 'select' && (
          <div className="flex space-x-2">
            {!isMeasuring ? (
              <Button 
                onClick={startMeasurement}
                className="flex-1"
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar Medição
              </Button>
            ) : (
              <>
                <Button 
                  onClick={finishMeasurement}
                  variant="default"
                  size="sm"
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Finalizar
                </Button>
                <Button 
                  onClick={cancelMeasurement}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </>
            )}
          </div>
        )}

        {/* Current Measurement Display */}
        {getCurrentMeasurementDisplay()}

        <Separator />

        {/* Settings */}
        <Collapsible open={showSettings} onOpenChange={setShowSettings}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Configurações</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3 pt-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Unidade de Área Preferida</Label>
              <Select value={preferredAreaUnit} onValueChange={(value: UnitType) => setPreferredAreaUnit(value)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m2">Metros quadrados (m²)</SelectItem>
                  <SelectItem value="ha">Hectares (ha)</SelectItem>
                  <SelectItem value="alqueire_paulista">Alqueire Paulista</SelectItem>
                  <SelectItem value="alqueire_mineiro">Alqueire Mineiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium flex items-center space-x-2">
                <Zap className="w-3 h-3" />
                <span>Snap to Field</span>
              </Label>
                <Switch
                  checked={snapToFieldEnabled}
                  onCheckedChange={setSnapToFieldEnabled}
                />
            </div>
            
            {snapToFieldEnabled && (
              <div className="bg-blue-50 border border-blue-200 p-2 rounded text-xs text-blue-800">
                <p>Medições serão automaticamente ajustadas para bordas de campos detectadas via NDVI</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Measurements List */}
        {totalMeasurements > 0 && (
          <>
            <Separator />
            
            <Collapsible open={showMeasurements} onOpenChange={setShowMeasurements}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <div className="flex items-center space-x-2">
                    <AreaChart className="w-4 h-4" />
                    <span>Medições ({totalMeasurements})</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showMeasurements ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-3 pt-3">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {/* Distance Measurements */}
                  {measurements.distances.map((distance) => (
                    <div
                      key={distance.id}
                      className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Ruler className="w-3 h-3 text-orange-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-orange-900">
                            {formatDistance(distance.distance)}
                          </div>
                          <div className="text-xs text-orange-600">
                            {distance.coordinates.length} pontos
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMeasurement('distance', distance.id)}
                        className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800 hover:bg-orange-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}

                  {/* Area Measurements */}
                  {measurements.areas.map((area) => (
                    <div
                      key={area.id}
                      className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Square className="w-3 h-3 text-green-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-green-900">
                            {UnitService.formatArea(area.area.m2, area.preferredUnit)}
                          </div>
                          <div className="text-xs text-green-600">
                            Perímetro: {formatDistance(area.perimeter)}
                          </div>
                          <div className="text-xs text-green-500">
                            {area.coordinates.length} pontos
                            {area.snapToField && ' • Snap ativo'}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMeasurement('area', area.id)}
                        className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Measurements Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    onClick={exportMeasurements}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Download className="w-3 h-3 mr-2" />
                    Exportar
                  </Button>
                  <Button
                    onClick={clearAllMeasurements}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Limpar Tudo
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {/* Quick Stats */}
        {totalMeasurements > 0 && (
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Distâncias:</span>
                <span className="font-medium">{measurements.distances.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Áreas:</span>
                <span className="font-medium">{measurements.areas.length}</span>
              </div>
              {measurements.areas.length > 0 && (
                <div className="flex justify-between">
                  <span>Área total:</span>
                  <span className="font-medium">
                    {UnitService.formatArea(
                      measurements.areas.reduce((sum, area) => sum + area.area.m2, 0),
                      preferredAreaUnit
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};