import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useMapPins } from '@/hooks/useMapPins';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Navigation,
  X
} from 'lucide-react';

export const PinControls: React.FC = () => {
  const { 
    pins, 
    isAddingPin, 
    removePin, 
    clearAllPins, 
    toggleAddingMode 
  } = useMapPins();

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
            className="flex-1"
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
          
          {pins.length > 0 && (
            <Button
              onClick={clearAllPins}
              variant="outline"
              size="sm"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {isAddingPin && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              Clique no mapa para adicionar um pin
            </p>
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
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pins.map((pin) => (
                <div
                  key={pin.id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full border border-white"
                        style={{ backgroundColor: pin.color || '#3b82f6' }}
                      />
                      <span className="text-sm font-medium truncate">
                        {pin.title}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {pin.coordinates[1].toFixed(4)}, {pin.coordinates[0].toFixed(4)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePin(pin.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {pins.length > 0 && (
          <>
            <Separator />
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Total: {pins.length} pin{pins.length !== 1 ? 's' : ''} no mapa
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};