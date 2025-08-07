import React from 'react';
import { Undo2, X, Save, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UnitService, UnitType } from '@/services/unitService';
import UnitSelector from './unit-selector';

interface DrawingControlsProps {
  pointsCount: number;
  canUndo: boolean;
  onUndo: () => void;
  onCancel: () => void;
  onSave: () => void;
  areaM2?: number;
  selectedUnit: UnitType;
  onUnitChange: (unit: UnitType) => void;
  isPolygonCloseable: boolean;
}

const DrawingControls: React.FC<DrawingControlsProps> = ({
  pointsCount,
  canUndo,
  onUndo,
  onCancel,
  onSave,
  areaM2,
  selectedUnit,
  onUnitChange,
  isPolygonCloseable
}) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
        <div className="flex items-center space-x-3">
          {/* Info da área atual */}
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {pointsCount} ponto{pointsCount !== 1 ? 's' : ''}
            </span>
            {areaM2 && areaM2 > 0 && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm font-medium text-primary">
                  {UnitService.formatArea(areaM2, selectedUnit)}
                </span>
                <UnitSelector
                  selectedUnit={selectedUnit}
                  onUnitChange={onUnitChange}
                  className="h-8"
                />
              </>
            )}
          </div>

          {/* Separador */}
          <div className="h-6 w-px bg-border" />

          {/* Controles de ação */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={onUndo}
              disabled={!canUndo}
              size="sm"
              variant="outline"
              className="h-8 px-3"
            >
              <Undo2 className="h-3 w-3 mr-1" />
              Desfazer
            </Button>

            <Button
              onClick={onCancel}
              size="sm"
              variant="outline"
              className="h-8 px-3 text-red-600 hover:text-red-700"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>

            {isPolygonCloseable && (
              <Button
                onClick={onSave}
                size="sm"
                className="h-8 px-3 bg-green-600 hover:bg-green-700"
              >
                <Save className="h-3 w-3 mr-1" />
                Concluir
              </Button>
            )}
          </div>
        </div>

        {/* Instruções */}
        <div className="mt-2 text-xs text-muted-foreground text-center">
          {pointsCount === 0 && "Toque no mapa para começar a desenhar"}
          {pointsCount > 0 && pointsCount < 3 && "Continue adicionando pontos"}
          {pointsCount >= 3 && !isPolygonCloseable && "Toque no primeiro ponto para fechar"}
          {isPolygonCloseable && "Área pronta para ser salva"}
        </div>
      </div>
    </div>
  );
};

export default DrawingControls;