import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Leaf,
  Droplets,
  Bug,
  Thermometer,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiagnosticData {
  biomassLow: number;
  biomassMedium: number;
  biomassHigh: number;
  waterStress: number;
  pestRisk: number;
  diseaseRisk: number;
  temperatureStress: number;
  totalArea: number;
  recommendations: string[];
  alerts: Array<{
    type: 'warning' | 'error' | 'success';
    message: string;
    action?: string;
  }>;
}

interface DiagnosticPanelProps {
  className?: string;
  position?: 'bottom' | 'top';
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  farmData?: any; // Replace with actual farm data type
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({
  className,
  position = 'bottom',
  isCollapsed = false,
  onToggleCollapsed,
  farmData
}) => {
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate diagnostic data loading
  useEffect(() => {
    const loadDiagnosticData = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: DiagnosticData = {
        biomassLow: 15,
        biomassMedium: 60,
        biomassHigh: 25,
        waterStress: 8,
        pestRisk: 12,
        diseaseRisk: 5,
        temperatureStress: 3,
        totalArea: 450.5,
        recommendations: [
          'Aumentar irrigação nas áreas com stress hídrico',
          'Monitorar região nordeste para possível infestação de pragas',
          'Aplicar fertilizante foliar nas áreas de baixa biomassa'
        ],
        alerts: [
          {
            type: 'warning',
            message: 'Stress hídrico detectado em 8% da área',
            action: 'Verificar sistema de irrigação'
          },
          {
            type: 'error',
            message: 'Risco de pragas elevado na região nordeste',
            action: 'Aplicar defensivos preventivos'
          },
          {
            type: 'success',
            message: '25% da área apresenta alta biomassa',
            action: 'Manter práticas atuais'
          }
        ]
      };
      
      setDiagnosticData(mockData);
      setIsLoading(false);
    };

    loadDiagnosticData();
  }, [farmData]);

  const getPercentageColor = (percentage: number, reverse = false) => {
    if (reverse) {
      if (percentage <= 5) return 'text-green-600';
      if (percentage <= 15) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAlertIcon = (type: 'warning' | 'error' | 'success') => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const positionClasses = {
    bottom: 'bottom-20 left-4 right-4',
    top: 'top-20 left-4 right-4'
  };

  if (isLoading) {
    return (
      <Card className={cn(
        "absolute z-40 shadow-lg pointer-events-auto",
        positionClasses[position],
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm">Carregando diagnóstico...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!diagnosticData) return null;

  return (
    <Card className={cn(
      "absolute z-40 shadow-lg pointer-events-auto",
      positionClasses[position],
      isCollapsed && "h-16",
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Diagnóstico FieldView
            <Badge variant="outline" className="text-xs">
              {diagnosticData.totalArea.toFixed(1)} ha
            </Badge>
          </div>
          {onToggleCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapsed}
              className="h-6 w-6"
            >
              {isCollapsed ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="space-y-4">
          {/* Biomass Analysis */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-600" />
              Análise de Biomassa
            </h4>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Baixa</span>
                  <span className={cn("text-xs font-mono", getPercentageColor(diagnosticData.biomassLow, true))}>
                    {diagnosticData.biomassLow}%
                  </span>
                </div>
                <Progress value={diagnosticData.biomassLow} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Média</span>
                  <span className={cn("text-xs font-mono", getPercentageColor(diagnosticData.biomassMedium))}>
                    {diagnosticData.biomassMedium}%
                  </span>
                </div>
                <Progress value={diagnosticData.biomassMedium} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Alta</span>
                  <span className={cn("text-xs font-mono", getPercentageColor(diagnosticData.biomassHigh))}>
                    {diagnosticData.biomassHigh}%
                  </span>
                </div>
                <Progress value={diagnosticData.biomassHigh} className="h-2" />
              </div>
            </div>
          </div>

          {/* Risk Indicators */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center space-y-1">
              <Droplets className="w-4 h-4 mx-auto text-blue-500" />
              <p className="text-xs text-muted-foreground">Stress Hídrico</p>
              <p className={cn("text-sm font-mono", getPercentageColor(diagnosticData.waterStress, true))}>
                {diagnosticData.waterStress}%
              </p>
            </div>
            
            <div className="text-center space-y-1">
              <Bug className="w-4 h-4 mx-auto text-red-500" />
              <p className="text-xs text-muted-foreground">Risco Pragas</p>
              <p className={cn("text-sm font-mono", getPercentageColor(diagnosticData.pestRisk, true))}>
                {diagnosticData.pestRisk}%
              </p>
            </div>
            
            <div className="text-center space-y-1">
              <AlertTriangle className="w-4 h-4 mx-auto text-yellow-500" />
              <p className="text-xs text-muted-foreground">Doenças</p>
              <p className={cn("text-sm font-mono", getPercentageColor(diagnosticData.diseaseRisk, true))}>
                {diagnosticData.diseaseRisk}%
              </p>
            </div>
            
            <div className="text-center space-y-1">
              <Thermometer className="w-4 h-4 mx-auto text-orange-500" />
              <p className="text-xs text-muted-foreground">Stress Térmico</p>
              <p className={cn("text-sm font-mono", getPercentageColor(diagnosticData.temperatureStress, true))}>
                {diagnosticData.temperatureStress}%
              </p>
            </div>
          </div>

          {/* Alerts */}
          {diagnosticData.alerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Alertas Ativos</h4>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {diagnosticData.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
                  >
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs">{alert.message}</p>
                      {alert.action && (
                        <p className="text-xs text-muted-foreground">{alert.action}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {diagnosticData.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recomendações</h4>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {diagnosticData.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
