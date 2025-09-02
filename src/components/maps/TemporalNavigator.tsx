import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw,
  Calendar,
  TrendingUp,
  Download
} from 'lucide-react';
import { useTemporalData } from '@/hooks/useTemporalData';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TemporalNavigatorProps {
  className?: string;
  position?: 'bottom' | 'top';
  onDateChange?: (date: Date) => void;
  onDataExport?: (data: any) => void;
}

export const TemporalNavigator: React.FC<TemporalNavigatorProps> = ({
  className,
  position = 'bottom',
  onDateChange,
  onDataExport
}) => {
  const {
    currentDate,
    dateRange,
    temporalData,
    isLoading,
    playAnimation,
    animationSpeed,
    setCurrentDate,
    setDateRange,
    setPlayAnimation,
    setAnimationSpeed,
    jumpToPreset,
    nextDate,
    previousDate,
    resetToToday
  } = useTemporalData();

  const [selectedPreset, setSelectedPreset] = useState<string>('');

  useEffect(() => {
    onDateChange?.(currentDate);
  }, [currentDate, onDateChange]);

  const getCurrentDataPoint = () => {
    if (!temporalData.length) return null;
    return temporalData.find(point => 
      point.date.toDateString() === currentDate.toDateString()
    ) || temporalData[temporalData.length - 1];
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    
    switch (preset) {
      case 'last-week':
        jumpToPreset('week');
        break;
      case 'last-month':
        jumpToPreset('month');
        break;
      case 'last-season':
        jumpToPreset('season');
        break;
      case 'last-year':
        jumpToPreset('year');
        break;
      default:
        break;
    }
  };

  const handleExportData = () => {
    const exportData = {
      dateRange: {
        start: dateRange[0],
        end: dateRange[1]
      },
      currentDate,
      data: temporalData,
      currentDataPoint: getCurrentDataPoint()
    };
    
    onDataExport?.(exportData);
  };

  const currentDataPoint = getCurrentDataPoint();
  const progressPercentage = temporalData.length > 0 
    ? ((temporalData.findIndex(point => point.date.toDateString() === currentDate.toDateString()) + 1) / temporalData.length) * 100
    : 0;

  const positionClasses = {
    bottom: 'bottom-4 left-4 right-4',
    top: 'top-20 left-4 right-4'
  };

  return (
    <Card className={cn(
      "absolute z-40 shadow-lg pointer-events-auto",
      positionClasses[position],
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Navegador Temporal
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {format(currentDate, 'dd/MM/yyyy', { locale: ptBR })}
            </Badge>
            <Button
              onClick={handleExportData}
              size="icon"
              variant="ghost"
              className="h-6 w-6"
            >
              <Download className="w-3 h-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Período rápido" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-week">Última semana</SelectItem>
              <SelectItem value="last-month">Último mês</SelectItem>
              <SelectItem value="last-season">Última safra</SelectItem>
              <SelectItem value="last-year">Ano passado</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={resetToToday}
            size="sm"
            variant="outline"
            className="h-8 px-2"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Hoje
          </Button>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <Button
            onClick={previousDate}
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={isLoading}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={() => setPlayAnimation(!playAnimation)}
            size="icon"
            variant={playAnimation ? "default" : "outline"}
            className="h-8 w-8"
            disabled={isLoading}
          >
            {playAnimation ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <Button
            onClick={nextDate}
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={isLoading}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Progress Timeline */}
          <div className="flex-1 mx-3">
            <div className="relative h-2 bg-secondary rounded-full">
              <div 
                className="absolute top-0 left-0 h-2 bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
              <div 
                className="absolute top-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background transform -translate-y-1/2 transition-all duration-300"
                style={{ left: `${progressPercentage}%`, marginLeft: '-6px' }}
              />
            </div>
          </div>

          {/* Animation Speed */}
          <Select 
            value={animationSpeed.toString()} 
            onValueChange={(value) => setAnimationSpeed(Number(value))}
          >
            <SelectTrigger className="h-8 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="500">2x</SelectItem>
              <SelectItem value="1000">1x</SelectItem>
              <SelectItem value="2000">0.5x</SelectItem>
              <SelectItem value="3000">0.3x</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Current Data Display */}
        {currentDataPoint && !isLoading && (
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-muted-foreground">NDVI</span>
              </div>
              <p className="text-sm font-mono">{currentDataPoint.ndvi.toFixed(3)}</p>
            </div>
            
            <div className="text-center space-y-1">
              <span className="text-xs text-muted-foreground">Temp</span>
              <p className="text-sm font-mono">{currentDataPoint.weather.temperature}°C</p>
            </div>
            
            <div className="text-center space-y-1">
              <span className="text-xs text-muted-foreground">Chuva</span>
              <p className="text-sm font-mono">{currentDataPoint.weather.precipitation}mm</p>
            </div>
            
            <div className="text-center space-y-1">
              <span className="text-xs text-muted-foreground">Umidade</span>
              <p className="text-sm font-mono">{currentDataPoint.weather.humidity}%</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="ml-2 text-xs text-muted-foreground">Carregando dados...</span>
          </div>
        )}

        {/* Date Range Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{format(dateRange[0], 'dd/MM/yyyy', { locale: ptBR })}</span>
          <span>←→</span>
          <span>{format(dateRange[1], 'dd/MM/yyyy', { locale: ptBR })}</span>
        </div>
      </CardContent>
    </Card>
  );
};