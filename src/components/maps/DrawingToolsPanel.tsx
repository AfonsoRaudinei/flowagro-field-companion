import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  MousePointer, 
  Square, 
  Circle, 
  Shapes, 
  PenTool, 
  Trash2, 
  Download,
  BarChart3,
  Save,
  X,
  Edit,
  AlertCircle
} from 'lucide-react';
import { DrawingTool, DrawnShape } from '@/hooks/useMapDrawing';
import { cn } from '@/lib/utils';

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
  currentShape: DrawnShape | null;
  onSaveShape: (name: string) => Promise<void>;
  onDeleteShape: (id: string) => void;
  onAnalyzeShape: (shape: DrawnShape) => void;
  drawnShapes: DrawnShape[];
  isLoading?: boolean;
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

const toolHints = {
  select: 'Selecionar e editar áreas existentes',
  polygon: 'Toque para marcar vértices, duplo-clique para fechar',
  rectangle: 'Arraste para criar o retângulo',
  circle: 'Arraste a partir do centro',
  freehand: 'Mantenha pressionado e desenhe livremente',
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
  currentShape,
  onSaveShape,
  onDeleteShape,
  onAnalyzeShape,
  drawnShapes,
  isLoading = false,
}) => {
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [selectedShape, setSelectedShape] = useState<DrawnShape | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!areaName.trim()) return;
    
    setIsSaving(true);
    try {
      await onSaveShape(areaName.trim());
      setShowSaveForm(false);
      setAreaName('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToolSelect = (tool: DrawingTool) => {
    onToolSelect(tool);
    if (tool === 'select') {
      setSelectedShape(null);
    }
  };

  // Show save form when a shape is finished drawing
  React.useEffect(() => {
    if (currentShape && !currentShape.agroPolygonId && !showSaveForm) {
      setShowSaveForm(true);
      setAreaName(currentShape.name || '');
    }
  }, [currentShape, showSaveForm]);

  return (
    <Card className="w-80 bg-background/95 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[rgb(0,87,255)]" />
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
              onClick={() => handleToolSelect(tool as DrawingTool)}
              className={cn(
                "flex flex-col gap-1 h-16 p-2 transition-all duration-200",
                "hover:bg-[rgba(0,87,255,0.1)] active:scale-95",
                activeTool === tool && "bg-[rgb(0,87,255)]/10 text-[rgb(0,87,255)] border-[rgb(0,87,255)]/20"
              )}
              disabled={isDrawingMode && activeTool !== tool}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{toolLabels[tool as DrawingTool]}</span>
            </Button>
          ))}
        </div>

        {/* Tool Hint */}
        {activeTool && (
          <div className="p-2 bg-[rgb(0,87,255)]/5 rounded-lg border border-[rgb(0,87,255)]/20">
            <p className="text-xs text-[rgb(0,87,255)] font-medium">
              {toolHints[activeTool]}
            </p>
          </div>
        )}

        {/* Save Form */}
        {showSaveForm && currentShape && (
          <div className="p-3 bg-card border border-border/50 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4 text-[rgb(0,87,255)]" />
              <span className="text-sm font-medium">Salvar Área</span>
            </div>
            <Input
              placeholder="Nome da área"
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!areaName.trim() || isSaving}
                className={cn(
                  "flex-1 text-sm font-medium",
                  "bg-[rgb(0,87,255)] hover:bg-[rgb(0,87,255)]/90"
                )}
                size="sm"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button
                onClick={() => {
                  setShowSaveForm(false);
                  onCancelDrawing();
                }}
                variant="outline"
                size="sm"
                className="flex-1 text-sm"
              >
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Drawing Actions */}
        {activeTool !== 'select' && !showSaveForm && (
          <div className="space-y-2">
            {!isDrawingMode ? (
              <Button 
                onClick={onStartDrawing} 
                className={cn(
                  "w-full font-medium transition-all duration-200",
                  "bg-[rgb(0,87,255)] hover:bg-[rgb(0,87,255)]/90 active:scale-98"
                )}
                size="sm"
              >
                Iniciar Desenho
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={onFinishDrawing} 
                  className={cn(
                    "font-medium transition-all duration-200",
                    "bg-[rgb(0,87,255)] hover:bg-[rgb(0,87,255)]/90 active:scale-98"
                  )}
                  size="sm"
                >
                  Finalizar
                </Button>
                <Button 
                  onClick={onCancelDrawing} 
                  variant="outline"
                  size="sm"
                  className="font-medium transition-all duration-200 hover:bg-[rgba(0,87,255,0.1)] active:scale-98"
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Areas List */}
        {drawnShapes.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                Minhas Áreas ({drawnShapes.length})
              </p>
            </div>
            
            <div className="max-h-32 overflow-y-auto space-y-1">
              {drawnShapes.map((shape) => (
                <div
                  key={shape.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg border transition-all duration-200",
                    "hover:bg-[rgba(0,87,255,0.1)] hover:border-[rgb(0,87,255)]/20",
                    selectedShape?.id === shape.id && "bg-[rgb(0,87,255)]/5 border-[rgb(0,87,255)]/20"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{shape.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {shape.area.toFixed(2)} ha
                      {shape.isAnalyzing && (
                        <span className="ml-1 text-[rgb(0,87,255)]">
                          • Salvando...
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-[rgba(0,87,255,0.1)]"
                      onClick={() => onAnalyzeShape(shape)}
                    >
                      <BarChart3 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-destructive/10 text-destructive"
                      onClick={() => onDeleteShape(shape.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button 
                onClick={onExport} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 text-xs font-medium hover:bg-[rgba(0,87,255,0.1)]"
              >
                <Download className="h-3 w-3" />
                Exportar
              </Button>
              <Button 
                onClick={onClearAll} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" />
                Limpar
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-[rgb(0,87,255)]/20 border-t-[rgb(0,87,255)] rounded-full animate-spin" />
              Carregando áreas...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};