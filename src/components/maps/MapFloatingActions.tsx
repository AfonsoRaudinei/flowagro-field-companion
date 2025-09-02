import React, { useState } from 'react';
import { FloatingActionButtons } from './FloatingActionButtons';
import { LocationTracker } from './LocationTracker';
import { FloatingAction } from '@/hooks/useFloatingActions';
import { 
  Layers, 
  Satellite, 
  Navigation, 
  MapPin, 
  Leaf,
  Ruler,
  Settings,
  Camera,
  Zap,
  Target
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PinControls } from './PinControls';
import { NDVIControls } from './NDVIControls';
import { NDVIAnalysis } from './NDVIAnalysis';
import NDVIHistory from './NDVIHistory';
import { PremiumButton } from '@/components/ui/premium-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface MapFloatingActionsProps {
  onCameraCapture?: () => void;
  onMapStyleChange?: (style: string) => void;
  onMeasurementStart?: () => void;
  className?: string;
}

export const MapFloatingActions: React.FC<MapFloatingActionsProps> = ({
  onCameraCapture,
  onMapStyleChange,
  onMeasurementStart,
  className
}) => {
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  const handleSheetOpen = (sheetType: string) => {
    setActiveSheet(sheetType);
  };

  const handleSheetClose = () => {
    setActiveSheet(null);
  };

  // Ações principais do FAB
  const floatingActions: FloatingAction[] = [
    {
      id: 'layers',
      icon: Layers,
      label: 'Camadas Base',
      action: () => handleSheetOpen('layers'),
      shortcut: 'L',
      primary: true
    },
    {
      id: 'location',
      icon: Target,
      label: 'Localização GPS',
      action: () => handleSheetOpen('location'),
      shortcut: 'G',
      primary: true
    },
    {
      id: 'ndvi',
      icon: Leaf,
      label: 'Análise NDVI',
      action: () => handleSheetOpen('ndvi'),
      shortcut: 'N',
      contextual: true
    },
    {
      id: 'pins',
      icon: MapPin,
      label: 'Gerenciar Pins',
      action: () => handleSheetOpen('pins'),
      shortcut: 'P',
      contextual: true
    },
    {
      id: 'navigation',
      icon: Navigation,
      label: 'Navegação Avançada',
      action: () => handleSheetOpen('navigation'),
      shortcut: 'R',
      contextual: true
    },
    {
      id: 'measurement',
      icon: Ruler,
      label: 'Ferramentas de Medição',
      action: () => onMeasurementStart?.(),
      shortcut: 'M',
      contextual: true
    },
    {
      id: 'camera',
      icon: Camera,
      label: 'Capturar Foto',
      action: () => onCameraCapture?.(),
      shortcut: 'C',
      contextual: true
    }
  ];

  return (
    <>
      {/* FAB Principal */}
      <FloatingActionButtons
        actions={floatingActions}
        position="bottom-right"
        maxVisibleActions={6}
        expandOnHover={false}
        contextSensitive={true}
        autoHide={false}
        className={className}
      />

      {/* Sheet para Camadas Base */}
      <Sheet open={activeSheet === 'layers'} onOpenChange={(open) => !open && handleSheetClose()}>
        <SheetContent side="bottom" className="h-[70vh] sm:h-[60vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-2">
              <Layers className="w-5 h-5" />
              <span>Camadas e Estilos do Mapa</span>
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estilos Base</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <PremiumButton
                  variant="outline"
                  className="h-20 flex-col space-y-2"
                  onClick={() => onMapStyleChange?.('satellite')}
                >
                  <Satellite className="w-6 h-6" />
                  <span className="text-xs">Satélite</span>
                </PremiumButton>
                
                <PremiumButton
                  variant="outline"
                  className="h-20 flex-col space-y-2"
                  onClick={() => onMapStyleChange?.('terrain')}
                >
                  <Target className="w-6 h-6" />
                  <span className="text-xs">Terreno</span>
                </PremiumButton>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Controles Premium</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <PremiumButton 
                  variant="premium" 
                  size="sm"
                  animation="full"
                  className="w-full justify-start"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Análise Avançada de Terreno
                </PremiumButton>
                
                <PremiumButton 
                  variant="glow" 
                  size="sm"
                  animation="pulse"
                  className="w-full justify-start"
                >
                  <Leaf className="w-4 h-4 mr-2" />
                  Monitor NDVI em Tempo Real
                </PremiumButton>
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet para Localização GPS */}
      <Sheet open={activeSheet === 'location'} onOpenChange={(open) => !open && handleSheetClose()}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Localização GPS</span>
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 overflow-y-auto h-[calc(70vh-8rem)]">
            <LocationTracker />
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet para NDVI */}
      <Sheet open={activeSheet === 'ndvi'} onOpenChange={(open) => !open && handleSheetClose()}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-2">
              <Leaf className="w-5 h-5" />
              <span>Análise NDVI Completa</span>
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-4 overflow-y-auto h-[calc(80vh-8rem)]">
            <NDVIControls />
            <NDVIAnalysis />
            <NDVIHistory />
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet para Pins */}
      <Sheet open={activeSheet === 'pins'} onOpenChange={(open) => !open && handleSheetClose()}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Gerenciamento de Pins</span>
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 overflow-y-auto h-[calc(70vh-8rem)]">
            <PinControls />
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet para Navegação Avançada */}
      <Sheet open={activeSheet === 'navigation'} onOpenChange={(open) => !open && handleSheetClose()}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-2">
              <Navigation className="w-5 h-5" />
              <span>Navegação Inteligente</span>
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="text-center space-y-2">
                  <Settings className="w-12 h-12 mx-auto text-muted-foreground" />
                  <h3 className="font-medium">Funcionalidade Premium</h3>
                  <p className="text-sm text-muted-foreground">
                    Navegação GPS inteligente com trilhas otimizadas
                  </p>
                  <Badge variant="outline" className="mt-2">Em Breve</Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recursos Inclusos:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Trilhas GPS personalizadas</li>
                    <li>• Navegação offline</li>
                    <li>• Pontos de interesse agrícolas</li>
                    <li>• Rotas otimizadas por terreno</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};