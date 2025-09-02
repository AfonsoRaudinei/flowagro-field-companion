import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause } from 'lucide-react';

interface TemporalTimelineSliderProps {
  className?: string;
  onDateChange?: (date: Date) => void;
}

export const TemporalTimelineSlider = ({ 
  className,
  onDateChange 
}: TemporalTimelineSliderProps) => {
  const [isPlaying, setIsPlaying] = React.useState(false);

  return (
    <Card className={`pointer-events-auto ${className || ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Timeline Temporal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </Button>
          <div className="flex-1 bg-secondary h-2 rounded-full">
            <div className="bg-primary h-2 rounded-full w-1/3" />
          </div>
          <span className="text-xs text-muted-foreground">2024-01-15</span>
        </div>
      </CardContent>
    </Card>
  );
};