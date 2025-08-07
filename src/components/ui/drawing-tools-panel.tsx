import React from 'react';
import { PenTool, Pentagon, CircleDot, Square, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DrawingTool {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
}

interface DrawingToolsPanelProps {
  selectedTool: string | null;
  onToolSelect: (toolId: string) => void;
  onRemoveSelected: () => void;
  onImportKML: () => void;
  hasSelectedShape: boolean;
  className?: string;
}

const DrawingToolsPanel: React.FC<DrawingToolsPanelProps> = ({
  selectedTool,
  onToolSelect,
  onRemoveSelected,
  onImportKML,
  hasSelectedShape,
  className
}) => {
  const drawingTools: DrawingTool[] = [
    {
      id: 'freehand',
      name: 'Mão Livre',
      icon: PenTool,
      description: 'Desenho livre à mão'
    },
    {
      id: 'polygon',
      name: 'Polígono',
      icon: Pentagon,
      description: 'Criar polígono por pontos'
    },
    {
      id: 'pivot',
      name: 'Pivô',
      icon: CircleDot,
      description: 'Área circular de irrigação'
    },
    {
      id: 'rectangle',
      name: 'Retângulo',
      icon: Square,
      description: 'Área retangular'
    }
  ];

  return (
    <Card className={cn("p-4 bg-background/95 backdrop-blur-sm border-border", className)}>
      <div className="space-y-4">
        {/* Drawing Tools */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Ferramentas de Desenho</h3>
          <div className="grid grid-cols-2 gap-2">
            {drawingTools.map((tool) => {
              const IconComponent = tool.icon;
              const isSelected = selectedTool === tool.id;
              
              return (
                <Button
                  key={tool.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => onToolSelect(tool.id)}
                  className={cn(
                    "h-16 flex-col gap-1 text-xs transition-all duration-200",
                    isSelected 
                      ? "bg-primary text-primary-foreground shadow-md scale-105" 
                      : "hover:bg-accent hover:text-accent-foreground hover:scale-102"
                  )}
                  title={tool.description}
                >
                  <IconComponent className="h-5 w-5" />
                  <span className="font-medium">{tool.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Import & Actions */}
        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Ações</h3>
          <div className="space-y-2">
            {/* Import KML/KMZ */}
            <Button
              variant="secondary"
              size="sm"
              onClick={onImportKML}
              className="w-full justify-start gap-2 h-12 text-sm transition-all duration-200 hover:scale-102"
              title="Importar arquivo KML ou KMZ"
            >
              <Upload className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Importar KML/KMZ</div>
                <div className="text-xs text-muted-foreground">Adicionar arquivo externo</div>
              </div>
            </Button>

            {/* Remove Selected */}
            <Button
              variant="destructive"
              size="sm"
              onClick={onRemoveSelected}
              disabled={!hasSelectedShape}
              className="w-full justify-start gap-2 h-12 text-sm transition-all duration-200 hover:scale-102 disabled:opacity-50"
              title="Remover forma selecionada"
            >
              <Trash2 className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Remover Selecionada</div>
                <div className="text-xs text-destructive-foreground/70">Excluir forma ativa</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Help Text */}
        {selectedTool && (
          <div className="border-t border-border pt-4">
            <div className="text-xs text-muted-foreground text-center">
              {selectedTool === 'freehand' && "Clique e arraste para desenhar livremente"}
              {selectedTool === 'polygon' && "Clique para adicionar pontos, duplo clique para finalizar"}
              {selectedTool === 'pivot' && "Clique no centro e arraste para definir o raio"}
              {selectedTool === 'rectangle' && "Clique e arraste para criar um retângulo"}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DrawingToolsPanel;