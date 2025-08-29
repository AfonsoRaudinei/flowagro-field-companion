import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useMapPins } from '@/hooks/useMapPins';
import { PinEditDialog } from './PinEditDialog';
import { DataExportDialog } from './DataExportDialog';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3,
  X,
  Tractor,
  Ruler,
  Settings,
  Filter,
  Download
} from 'lucide-react';

const getPinIcon = (type: string) => {
  switch (type) {
    case 'farm': return Tractor;
    case 'measurement': return Ruler;
    case 'custom': return Settings;
    default: return MapPin;
  }
};

export const PinControls: React.FC = () => {
  const { 
    pins, 
    allPins,
    isAddingPin, 
    activeFilters,
    removePin, 
    updatePin,
    clearAllPins, 
    toggleAddingMode,
    toggleFilter
  } = useMapPins();
  
  const [editingPin, setEditingPin] = useState<typeof pins[0] | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Pins do Mapa</span>
          </div>
          <Badge variant="secondary">{pins.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Pin Controls */}
        <div className="flex space-x-2">
          <Button 
            onClick={toggleAddingMode}
            variant={isAddingPin ? "destructive" : "default"}
            size="sm"
            className="flex-1 rounded-xl"
          >
            {isAddingPin ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Pin
              </>
            )}
          </Button>
          
          {allPins.length > 0 && (
            <>
              <Button
                onClick={clearAllPins}
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setShowExportDialog(true)}
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                <Download className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {isAddingPin && (
          <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl">
            <p className="text-sm text-primary font-medium">
              Clique no mapa para adicionar um pin
            </p>
          </div>
        )}

        {/* Filter Controls */}
        {allPins.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtrar por Tipo</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { type: 'default', label: 'Padrão', icon: MapPin },
                { type: 'farm', label: 'Fazenda', icon: Tractor },
                { type: 'measurement', label: 'Medição', icon: Ruler },
                { type: 'custom', label: 'Personalizado', icon: Settings }
              ].map(({ type, label, icon: Icon }) => (
                <Button
                  key={type}
                  size="sm"
                  variant={activeFilters.has(type) ? "default" : "outline"}
                  onClick={() => toggleFilter(type)}
                  className="h-8 px-3 rounded-lg text-xs"
                >
                  <Icon className="w-3 h-3 mr-1.5" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Pin List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Pins Ativos</h4>
          
          {pins.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum pin adicionado ainda
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pins.map((pin) => {
                const PinIcon = getPinIcon(pin.type || 'default');
                return (
                  <div
                    key={pin.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-xl hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: pin.color || '#0057FF' }}
                          />
                          <PinIcon className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">
                            {pin.title || 'Pin sem título'}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            {pin.type === 'farm' && 'Fazenda'}
                            {pin.type === 'measurement' && 'Medição'}
                            {pin.type === 'custom' && 'Personalizado'}
                            {pin.type === 'default' && 'Padrão'}
                            {' • '}
                            {pin.coordinates[1].toFixed(4)}, {pin.coordinates[0].toFixed(4)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingPin(pin)}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removePin(pin.id)}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {allPins.length > 0 && (
          <>
            <Separator />
            <div className="bg-muted/50 p-3 rounded-xl">
              <p className="text-xs text-muted-foreground">
                {pins.length === allPins.length 
                  ? `Total: ${allPins.length} pin${allPins.length !== 1 ? 's' : ''} no mapa`
                  : `Mostrando: ${pins.length} de ${allPins.length} pin${allPins.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <PinEditDialog
        pin={editingPin}
        open={!!editingPin}
        onClose={() => setEditingPin(null)}
        onSave={updatePin}
      />

      {/* Export Dialog */}
      <DataExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
    </Card>
  );
};