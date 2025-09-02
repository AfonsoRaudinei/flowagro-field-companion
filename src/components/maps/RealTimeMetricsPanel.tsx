import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RealTimeMetricsPanelProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export const RealTimeMetricsPanel = ({ 
  className,
  position = 'top-right'
}: RealTimeMetricsPanelProps) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <Card className={`absolute w-64 z-40 shadow-lg pointer-events-auto ${positionClasses[position]} ${className || ''}`}>
      <CardHeader>
        <CardTitle className="text-sm">Métricas em Tempo Real</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>NDVI:</span>
            <span className="font-mono">0.750</span>
          </div>
          <div className="flex justify-between">
            <span>Temperatura:</span>
            <span className="font-mono">28°C</span>
          </div>
          <div className="flex justify-between">
            <span>Umidade:</span>
            <span className="font-mono">65%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};