import React, { memo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useMapPins } from '@/hooks/useMapPins';
import { useToast } from '@/hooks/use-toast';
import { 
  Trash2, 
  MapPin,
  Tractor,
  Ruler,
  Settings,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const getPinIcon = (type: string) => {
  switch (type) {
    case 'farm': return Tractor;
    case 'measurement': return Ruler;
    case 'custom': return Settings;
    default: return MapPin;
  }
};

interface NavigationPointRemoverProps {
  className?: string;
}

export const NavigationPointRemover = memo<NavigationPointRemoverProps>(({ className }) => {
  const { pins, removePin, clearAllPins } = useMapPins();
  const { toast } = useToast();
  const [selectedPins, setSelectedPins] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Toggle individual pin selection
  const togglePinSelection = useCallback((pinId: string) => {
    setSelectedPins(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(pinId)) {
        newSelection.delete(pinId);
      } else {
        newSelection.add(pinId);
      }
      return newSelection;
    });
  }, []);

  // Select all pins
  const selectAllPins = useCallback(() => {
    setSelectedPins(new Set(pins.map(pin => pin.id)));
  }, [pins]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedPins(new Set());
    setIsMultiSelectMode(false);
  }, []);

  // Remove selected pins
  const removeSelectedPins = useCallback(async () => {
    const pinCount = selectedPins.size;
    try {
      await Promise.all(Array.from(selectedPins).map(pinId => removePin(pinId)));
      
      toast({
        title: "✅ Pontos Removidos",
        description: `${pinCount} ponto${pinCount !== 1 ? 's' : ''} de navegação removido${pinCount !== 1 ? 's' : ''} com sucesso.`,
        duration: 3000
      });
      
      clearSelection();
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível remover alguns pontos. Tente novamente.",
        variant: "destructive",
        duration: 4000
      });
    }
  }, [selectedPins, removePin, toast, clearSelection]);

  // Remove all pins
  const handleClearAll = useCallback(async () => {
    try {
      await clearAllPins();
      toast({
        title: "✅ Todos os Pontos Removidos",
        description: "Todos os pontos de navegação foram removidos do mapa.",
        duration: 3000
      });
      clearSelection();
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível remover todos os pontos. Tente novamente.",
        variant: "destructive",
        duration: 4000
      });
    }
  }, [clearAllPins, toast, clearSelection]);

  // Toggle multi-select mode
  const toggleMultiSelectMode = useCallback(() => {
    setIsMultiSelectMode(prev => !prev);
    if (isMultiSelectMode) {
      clearSelection();
    }
  }, [isMultiSelectMode, clearSelection]);

  if (pins.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum ponto de navegação encontrado
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            <span className="text-foreground">Remover Pontos</span>
          </div>
          <Badge variant="secondary">{pins.length} ponto{pins.length !== 1 ? 's' : ''}</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Control Actions */}
        <div className="flex gap-2">
          <Button
            onClick={toggleMultiSelectMode}
            variant={isMultiSelectMode ? "default" : "outline"}
            size="sm"
            className="flex-1 rounded-xl"
          >
            {isMultiSelectMode ? (
              <>
                <CheckSquare className="w-4 h-4 mr-2" />
                Seleção Múltipla
              </>
            ) : (
              <>
                <Square className="w-4 h-4 mr-2" />
                Selecionar Múltiplos
              </>
            )}
          </Button>

          {isMultiSelectMode && selectedPins.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="rounded-xl">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover Selecionados ({selectedPins.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Confirmar Remoção
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Deseja remover {selectedPins.size} ponto{selectedPins.size !== 1 ? 's' : ''} de navegação selecionado{selectedPins.size !== 1 ? 's' : ''}? 
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={removeSelectedPins}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Multi-select controls */}
        {isMultiSelectMode && (
          <div className="flex gap-2">
            <Button
              onClick={selectAllPins}
              variant="outline"
              size="sm"
              className="flex-1 rounded-lg text-xs"
            >
              Selecionar Todos
            </Button>
            <Button
              onClick={clearSelection}
              variant="outline"
              size="sm"
              className="flex-1 rounded-lg text-xs"
            >
              Limpar Seleção
            </Button>
          </div>
        )}

        <Separator />

        {/* Navigation Points List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Pontos de Navegação
          </h4>
          
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {pins.map((pin) => {
              const PinIcon = getPinIcon(pin.type || 'default');
              const isSelected = selectedPins.has(pin.id);
              
              return (
                <div
                  key={pin.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    isSelected 
                      ? "bg-destructive/10 border-destructive/30" 
                      : "bg-muted/30 border-border/50 hover:bg-muted/50"
                  )}
                >
                  {/* Selection checkbox (only in multi-select mode) */}
                  {isMultiSelectMode && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => togglePinSelection(pin.id)}
                      className="data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                    />
                  )}

                  {/* Pin info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-background shadow-sm"
                        style={{ backgroundColor: pin.color || '#0057FF' }}
                      />
                      <PinIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {pin.title || 'Ponto sem título'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="capitalize">
                          {pin.type === 'farm' && 'Fazenda'}
                          {pin.type === 'measurement' && 'Medição'}
                          {pin.type === 'custom' && 'Personalizado'}
                          {pin.type === 'default' && 'Padrão'}
                        </span>
                        {' • '}
                        {pin.coordinates[1].toFixed(4)}, {pin.coordinates[0].toFixed(4)}
                      </div>
                    </div>
                  </div>

                  {/* Individual remove button (only when not in multi-select mode) */}
                  {!isMultiSelectMode && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            Remover Ponto
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja remover o ponto "{pin.title || 'Ponto sem título'}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => removePin(pin.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Clear All Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="w-full rounded-xl">
              <Trash2 className="w-4 h-4 mr-2" />
              Remover Todos os Pontos ({pins.length})
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Remover Todos os Pontos
              </AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação irá remover permanentemente todos os {pins.length} ponto{pins.length !== 1 ? 's' : ''} de navegação do mapa. 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleClearAll}
                className="bg-destructive hover:bg-destructive/90"
              >
                Remover Todos
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
});

NavigationPointRemover.displayName = 'NavigationPointRemover';

export default NavigationPointRemover;