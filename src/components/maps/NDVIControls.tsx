import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNDVILayer } from '@/hooks/useNDVILayer';
import { 
  Leaf, 
  Eye, 
  EyeOff, 
  Loader2,
  AlertCircle,
  Calendar
} from 'lucide-react';

export const NDVIControls: React.FC = () => {
  const { 
    config, 
    isLoading, 
    error,
    toggleVisibility,
    setOpacity,
    setColorScale,
    setDateRange,
    loadNDVIData
  } = useNDVILayer();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Leaf className="w-5 h-5" />
            <span>NDVI</span>
          </div>
          <Badge variant={config.visible ? "default" : "secondary"}>
            {config.visible ? "Ativo" : "Inativo"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visibility Toggle */}
        <div className="flex space-x-2">
          <Button 
            onClick={toggleVisibility}
            variant={config.visible ? "destructive" : "default"}
            size="sm"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : config.visible ? (
              <EyeOff className="w-4 h-4 mr-2" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
            )}
            {config.visible ? 'Ocultar NDVI' : 'Mostrar NDVI'}
          </Button>
          
          <Button
            onClick={loadNDVIData}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <Leaf className="w-4 h-4" />
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <p className="text-sm text-red-800 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </p>
          </div>
        )}

        <Separator />

        {/* Opacity Control */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Opacidade: {Math.round(config.opacity * 100)}%
          </Label>
          <Slider
            value={[config.opacity]}
            onValueChange={(value) => setOpacity(value[0])}
            max={1}
            min={0}
            step={0.1}
            className="w-full"
            disabled={!config.visible}
          />
        </div>

        <Separator />

        {/* Color Scale */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Escala de Cores</Label>
          <Select 
            value={config.colorScale} 
            onValueChange={setColorScale}
            disabled={!config.visible}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viridis">Viridis (Verde-Azul)</SelectItem>
              <SelectItem value="plasma">Plasma (Rosa-Amarelo)</SelectItem>
              <SelectItem value="inferno">Inferno (Preto-Amarelo)</SelectItem>
              <SelectItem value="magma">Magma (Preto-Rosa)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Período de Dados
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Início</Label>
              <Input
                type="date"
                value={config.dateRange.start}
                onChange={(e) => setDateRange({
                  ...config.dateRange,
                  start: e.target.value
                })}
                disabled={!config.visible}
                className="text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Fim</Label>
              <Input
                type="date"
                value={config.dateRange.end}
                onChange={(e) => setDateRange({
                  ...config.dateRange,
                  end: e.target.value
                })}
                disabled={!config.visible}
                className="text-xs"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Info */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>NDVI:</strong> Índice de Vegetação por Diferença Normalizada. 
            Valores mais altos (verde) indicam vegetação mais densa e saudável.
          </p>
        </div>

        {config.visible && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <p className="text-xs text-green-800">
              ⚠️ <strong>Demonstração:</strong> Dados NDVI simulados. 
              A integração real com Sentinel-2 será implementada.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};