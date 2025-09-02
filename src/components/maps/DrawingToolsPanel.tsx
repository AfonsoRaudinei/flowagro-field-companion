import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MousePointer, 
  Square, 
  Circle, 
  Shapes, 
  PenTool, 
  Trash2, 
  Download,
  BarChart3 
} from 'lucide-react';
import { DrawingTool } from '@/hooks/useMapDrawing';

interface DrawingToolsPanelProps {
  activeTool: DrawingTool;
  onToolSelect: (tool: DrawingTool) => void;
  onStartDrawing: () => void;
  onFinishDrawing: () => void;
  onCancelDrawing: () => void;
  onClearAll: () => void;
  onExport: () => void;
  isDrawingMode: boolean;
  shapesCount: number;
}

const toolIcons = {
  select: MousePointer,
  polygon: Shapes,
  rectangle: Square,
  circle: Circle,
  freehand: PenTool,
};

const toolLabels = {
  select: 'Selecionar',
  polygon: 'Polígono',
  rectangle: 'Retângulo',
  circle: 'Círculo',
  freehand: 'Desenho Livre',
};

export const DrawingToolsPanel: React.FC<DrawingToolsPanelProps> = ({
  activeTool,
  onToolSelect,
  onStartDrawing,
  onFinishDrawing,
  onCancelDrawing,
  onClearAll,
  onExport,
  isDrawingMode,
  shapesCount,
}) => {
  return (
    <Card className="w-80 bg-background/95 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Ferramentas de Desenho
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drawing Tools */}
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(toolIcons).map(([tool, Icon]) => (
            <Button
              key={tool}
              variant={activeTool === tool ? "default" : "outline"}
              size="sm"
              onClick={() => onToolSelect(tool as DrawingTool)}
              className="flex flex-col gap-1 h-16 p-2"
              disabled={isDrawingMode && activeTool !== tool}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs">{toolLabels[tool as DrawingTool]}</span>
            </Button>
          ))}
        </div>

        {/* Drawing Actions */}
        {activeTool !== 'select' && (
          <div className="space-y-2">
            {!isDrawingMode ? (
              <Button 
                onClick={onStartDrawing} 
                className="w-full"
                size="sm"
              >
                Iniciar Desenho
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={onFinishDrawing} 
                  variant="default"
                  size="sm"
                >
                  Finalizar
                </Button>
                <Button 
                  onClick={onCancelDrawing} 
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Shape Management */}
        {shapesCount > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              {shapesCount} área{shapesCount !== 1 ? 's' : ''} desenhada{shapesCount !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={onExport} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Exportar
              </Button>
              <Button 
                onClick={onClearAll} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                Limpar
              </Button>
            </div>
          </div>
        )}

        {/* Drawing Instructions */}
        {isDrawingMode && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-primary">
              {activeTool === 'polygon' && 'Clique no mapa para adicionar pontos. Clique em "Finalizar" para completar o polígono.'}
              {activeTool === 'rectangle' && 'Clique e arraste para criar um retângulo.'}
              {activeTool === 'circle' && 'Clique e arraste para criar um círculo.'}
              {activeTool === 'freehand' && 'Mantenha pressionado e desenhe livremente no mapa.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};