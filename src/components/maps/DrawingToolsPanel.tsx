import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Square, 
  Circle, 
  Pentagon, 
  MousePointer, 
  Pencil,
  Play,
  Square as StopSquare,
  X,
  Trash2,
  Download,
  BarChart3
} from 'lucide-react';
import { useMapDrawing, DrawingTool } from '@/hooks/useMapDrawing';
import { cn } from '@/lib/utils';

interface DrawingToolsPanelProps {
  className?: string;
  position?: 'left' | 'right';
  onClose?: () => void;
}

export const DrawingToolsPanel: React.FC<DrawingToolsPanelProps> = ({
  className,
  position = 'left',
  onClose
}) => {
  const {
    activeTool,
    drawnShapes,
    isDrawingMode,
    currentShape,
    setActiveTool,
    startDrawing,
    finishDrawing,
    cancelDrawing,
    deleteShape,
    analyzeShape,
    exportShapes,
    clearAllShapes
  } = useMapDrawing();

  const [analysisResult, setAnalysisResult] = useState<{
    ndvi: number;
    biomass: string;
    recommendation: string;
  } | null>(null);

  const tools: Array<{ id: DrawingTool; icon: React.ReactNode; label: string }> = [
    { id: 'select', icon: <MousePointer className="w-4 h-4" />, label: 'Selecionar' },
    { id: 'polygon', icon: <Pentagon className="w-4 h-4" />, label: 'Polígono' },
    { id: 'rectangle', icon: <Square className="w-4 h-4" />, label: 'Retângulo' },
    { id: 'circle', icon: <Circle className="w-4 h-4" />, label: 'Círculo' },
    { id: 'freehand', icon: <Pencil className="w-4 h-4" />, label: 'Livre' },
  ];

  const handleAnalyzeShape = async (shape: any) => {
    try {
      const result = await analyzeShape(shape);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error analyzing shape:', error);
    }
  };

  const getBiomassColor = (biomass: string) => {
    switch (biomass) {
      case 'Alta': return 'bg-green-500';
      case 'Média': return 'bg-yellow-500';
      case 'Baixa': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const positionClasses = {
    left: 'left-4',
    right: 'right-4'
  };

  return (
    <Card className={cn(
      "absolute top-4 w-80 z-50 shadow-lg pointer-events-auto",
      positionClasses[position],
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          Ferramentas de Desenho
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Drawing Tools */}
        <div className="grid grid-cols-3 gap-2">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={activeTool === tool.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTool(tool.id)}
              className="flex flex-col gap-1 h-auto py-2"
            >
              {tool.icon}
              <span className="text-xs">{tool.label}</span>
            </Button>
          ))}
        </div>

        {/* Drawing Controls */}
        {activeTool !== 'select' && (
          <div className="flex gap-2">
            {!isDrawingMode ? (
              <Button
                onClick={startDrawing}
                size="sm"
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar
              </Button>
            ) : (
              <>
                <Button
                  onClick={finishDrawing}
                  size="sm"
                  variant="default"
                >
                  <StopSquare className="w-4 h-4 mr-2" />
                  Finalizar
                </Button>
                <Button
                  onClick={cancelDrawing}
                  size="sm"
                  variant="outline"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        )}

        <Separator />

        {/* Drawn Shapes List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Formas Desenhadas ({drawnShapes.length})
            </h4>
            {drawnShapes.length > 0 && (
              <div className="flex gap-1">
                <Button
                  onClick={exportShapes}
                  size="icon"
                  variant="outline"
                  className="h-6 w-6"
                >
                  <Download className="w-3 h-3" />
                </Button>
                <Button
                  onClick={clearAllShapes}
                  size="icon"
                  variant="outline"
                  className="h-6 w-6"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          {drawnShapes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              Nenhuma forma desenhada
            </p>
          ) : (
            <div className="max-h-32 overflow-y-auto space-y-1">
              {drawnShapes.map((shape) => (
                <div
                  key={shape.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {shape.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {shape.area.toFixed(2)} ha
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleAnalyzeShape(shape)}
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                    >
                      <BarChart3 className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => deleteShape(shape.id)}
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analysis Result */}
        {analysisResult && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Análise da Área</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">NDVI:</span>
                  <Badge variant="outline">{analysisResult.ndvi.toFixed(3)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Biomassa:</span>
                  <Badge className={cn("text-white", getBiomassColor(analysisResult.biomass))}>
                    {analysisResult.biomass}
                  </Badge>
                </div>
                <div className="p-2 rounded-md bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    {analysisResult.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Status */}
        {isDrawingMode && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs">Modo de desenho ativo</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};