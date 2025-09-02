import React, { useState } from 'react';
import { FloatingActionButtons } from './FloatingActionButtons';
import { FloatingAction } from '@/hooks/useFloatingActions';
import { 
  Layers, 
  Satellite, 
  Navigation, 
  MapPin, 
  Leaf,
  Ruler,
  Camera,
  Target
} from 'lucide-react';

interface MapFloatingActionsProps {
  onCameraCapture?: () => void;
  onMapStyleChange?: (style: string) => void;
  onMeasurementStart?: () => void;
  onOpenSheet?: (sheetType: string) => void;
  className?: string;
}

export const MapFloatingActions: React.FC<MapFloatingActionsProps> = ({
  onCameraCapture,
  onMapStyleChange,
  onMeasurementStart,
  onOpenSheet,
  className
}) => {
  // Ações principais do FAB com shortcuts definidos
  const floatingActions: FloatingAction[] = [
    {
      id: 'layers',
      icon: Layers,
      label: 'Camadas Base',
      action: () => onOpenSheet?.('layers'),
      shortcut: 'L',
      primary: true
    },
    {
      id: 'location', 
      icon: Target,
      label: 'Localização GPS',
      action: () => onOpenSheet?.('location'),
      shortcut: 'G',
      primary: true
    },
    {
      id: 'ndvi',
      icon: Leaf,
      label: 'Análise NDVI', 
      action: () => onOpenSheet?.('ndvi'),
      shortcut: 'N',
      contextual: true
    },
    {
      id: 'pins',
      icon: MapPin,
      label: 'Marketing Pins',
      action: () => onOpenSheet?.('pins'),
      shortcut: 'P',
      contextual: true
    },
    {
      id: 'scanner',
      icon: Navigation,
      label: 'Scanner Inteligente',
      action: () => onOpenSheet?.('scanner'), 
      shortcut: 'S',
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
    <div className="fixed bottom-6 right-6 z-30">
      <FloatingActionButtons
        actions={floatingActions}
        position="bottom-right"
        maxVisibleActions={6}
        expandOnHover={false}
        contextSensitive={true}
        autoHide={false}
        className="pointer-events-auto"
      />
    </div>
  );
};