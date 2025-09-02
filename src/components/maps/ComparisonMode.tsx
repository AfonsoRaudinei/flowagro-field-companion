import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  CalendarIcon,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  RefreshCw,
  SplitSquareHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useComparisonMode } from '@/hooks/useComparisonMode';
import { cn } from '@/lib/utils';

interface ComparisonModeProps {
  className?: string;
  onClose?: () => void;
}

export const ComparisonMode = ({ className, onClose }: ComparisonModeProps) => {
  const {
    isComparisonMode,
    setComparisonMode,
    leftDate,
    rightDate,
    setLeftDate,
    setRightDate,
    leftData,
    rightData,
    analysis,
    isLoading,
    error,
    swapDates,
    loadPreset
  } = useComparisonMode();

  useEffect(() => {
    setComparisonMode(true);
    return () => setComparisonMode(false);
  }, [setComparisonMode]);

  const getTrendIcon = (value: number) => {
    if (Math.abs(value) < 0.01) return <Minus className="w-4 h-4 text-gray-500" />;
    return value > 0 ? 
      <TrendingUp className="w-4 h-4 text-green-500" /> : 
      <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getChangeColor = (value: number) => {
    if (Math.abs(value) < 0.01) return 'text-gray-500';
    return value > 0 ? 'text-green-600' : 'text-red-600';
  };

  const formatChange = (value: number, unit: string = '') => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}${unit}`;
  };

  return (
    <Card className={`w-full max-w-4xl ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SplitSquareHorizontal className="w-5 h-5 text-primary" />
            Modo Comparação
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={swapDates}
              className="text-xs"
            >
              <ArrowLeftRight className="w-3 h-3 mr-1" />
              Trocar
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Data Inicial</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !leftDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {leftDate ? format(leftDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={leftDate}
                  onSelect={(date) => date && setLeftDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Data Final</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !rightDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {rightDate ? format(rightDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={rightDate}
                  onSelect={(date) => date && setRightDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Presets:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadPreset('year-comparison')}
            className="text-xs px-2 py-1 h-6"
          >
            Mesmo período (ano passado)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadPreset('season-comparison')}
            className="text-xs px-2 py-1 h-6"
          >
            Trimestre anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadPreset('growth-comparison')}
            className="text-xs px-2 py-1 h-6"
          >
            Mês anterior
          </Button>
        </div>

        <Separator />

        {/* Loading/Error States */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Carregando dados de comparação...</span>
          </div>
        )}

        {error && (
          <div className="text-destructive text-center py-4">
            {error}
          </div>
        )}

        {/* Comparison Results */}
        {!isLoading && !error && leftData && rightData && analysis && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {format(leftDate, "dd/MM/yyyy", { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>NDVI:</span>
                    <span className="font-mono">{leftData.ndvi.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Temperatura:</span>
                    <span className="font-mono">{leftData.weather.temperature}°C</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Precipitação:</span>
                    <span className="font-mono">{leftData.weather.precipitation}mm</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Umidade Solo:</span>
                    <span className="font-mono">{leftData.soil.moisture}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {format(rightDate, "dd/MM/yyyy", { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>NDVI:</span>
                    <span className="font-mono">{rightData.ndvi.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Temperatura:</span>
                    <span className="font-mono">{rightData.weather.temperature}°C</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Precipitação:</span>
                    <span className="font-mono">{rightData.weather.precipitation}mm</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Umidade Solo:</span>
                    <span className="font-mono">{rightData.soil.moisture}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  Análise de Mudanças
                  {analysis.significantChange && (
                    <Badge variant="secondary" className="text-xs">
                      Mudança Significativa ({analysis.changePercentage.toFixed(1)}%)
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Variação NDVI:</span>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(analysis.ndviDifference)}
                        <span className={`text-sm font-mono ${getChangeColor(analysis.ndviDifference)}`}>
                          {formatChange(analysis.ndviDifference)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Variação Temperatura:</span>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(analysis.temperatureDifference)}
                        <span className={`text-sm font-mono ${getChangeColor(analysis.temperatureDifference)}`}>
                          {formatChange(analysis.temperatureDifference, '°C')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Variação Precipitação:</span>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(analysis.precipitationDifference)}
                        <span className={`text-sm font-mono ${getChangeColor(analysis.precipitationDifference)}`}>
                          {formatChange(analysis.precipitationDifference, 'mm')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Variação Umidade Solo:</span>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(analysis.soilMoistureDifference)}
                        <span className={`text-sm font-mono ${getChangeColor(analysis.soilMoistureDifference)}`}>
                          {formatChange(analysis.soilMoistureDifference, '%')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {analysis.significantChange && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Insight:</strong> Foi detectada uma mudança significativa no NDVI 
                      ({analysis.changePercentage.toFixed(1)}% de variação), indicando alteração 
                      considerável na condição da vegetação entre os períodos selecionados.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};