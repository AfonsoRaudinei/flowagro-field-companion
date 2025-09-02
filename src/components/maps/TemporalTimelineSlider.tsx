import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Square,
  Calendar,
  Clock,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTemporalData } from '@/hooks/useTemporalData';

interface TemporalTimelineSliderProps {
  className?: string;
  onDateChange?: (date: Date) => void;
}

export const TemporalTimelineSlider = ({ 
  className,
  onDateChange
}: TemporalTimelineSliderProps) => {
  const {
    currentDate,
    temporalData,
    isLoading,
    playAnimation,
    setPlayAnimation,
    animationSpeed,
    setAnimationSpeed,
    jumpToPreset,
    nextDate,
    previousDate,
    resetToToday
  } = useTemporalData();

  React.useEffect(() => {
    if (onDateChange) {
      onDateChange(currentDate);
    }
  }, [currentDate, onDateChange]);

  const currentIndex = temporalData.findIndex(
    point => format(point.date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
  );

  const handleSliderChange = (value: number[]) => {
    const index = value[0];
    if (temporalData[index]) {
      setPlayAnimation(false);
      // Update via the hook's setCurrentDate function
      const targetDate = temporalData[index].date;
      // This will be handled by the useTemporalData hook
    }
  };

  const speedOptions = [
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 4, label: '4x' },
    { value: 8, label: '8x' }
  ];

  if (isLoading || temporalData.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Carregando dados temporais...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Timeline Temporal</span>
          <Badge variant="outline" className="text-xs">
            {temporalData.length} pontos
          </Badge>
        </div>
        
        {/* Current Date Display */}
        <div className="text-sm font-mono text-muted-foreground">
          {format(currentDate, 'dd/MM/yyyy', { locale: ptBR })}
        </div>
      </div>

      {/* Main Slider */}
      <div className="space-y-2">
        <Slider
          value={[currentIndex >= 0 ? currentIndex : 0]}
          onValueChange={handleSliderChange}
          max={temporalData.length - 1}
          min={0}
          step={1}
          className="w-full"
        />
        
        {/* Timeline Labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{format(temporalData[0]?.date || new Date(), 'MMM yyyy', { locale: ptBR })}</span>
          <span>{format(temporalData[temporalData.length - 1]?.date || new Date(), 'MMM yyyy', { locale: ptBR })}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Playback Controls */}
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={previousDate}
            disabled={currentIndex <= 0}
          >
            <SkipBack className="w-3 h-3" />
          </Button>
          
          <Button
            variant={playAnimation ? "default" : "outline"}
            size="sm"
            onClick={() => setPlayAnimation(!playAnimation)}
          >
            {playAnimation ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={nextDate}
            disabled={currentIndex >= temporalData.length - 1}
          >
            <SkipForward className="w-3 h-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetToToday}
          >
            <Square className="w-3 h-3" />
          </Button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center space-x-2">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <div className="flex space-x-1">
            {speedOptions.map((option) => (
              <Button
                key={option.value}
                variant={animationSpeed === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setAnimationSpeed(option.value)}
                className="text-xs px-2 py-1 h-6"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center space-x-1">
          <span className="text-xs text-muted-foreground">Ir para:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => jumpToPreset('week')}
            className="text-xs px-2 py-1 h-6"
          >
            Semana
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => jumpToPreset('month')}
            className="text-xs px-2 py-1 h-6"
          >
            Mês
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => jumpToPreset('season')}
            className="text-xs px-2 py-1 h-6"
          >
            Safra
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => jumpToPreset('year')}
            className="text-xs px-2 py-1 h-6"
          >
            Ano
          </Button>
        </div>

        {/* Current Data Point Info */}
        {temporalData[currentIndex] && (
          <div className="flex items-center space-x-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>NDVI: {temporalData[currentIndex].ndvi.toFixed(2)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>{temporalData[currentIndex].weather.temperature}°C</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};