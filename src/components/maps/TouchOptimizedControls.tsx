import React from 'react';
import { useTouchGestures } from '../../hooks/useTouchGestures';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { ZoomIn, ZoomOut, RotateCcw, Navigation, Target, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

export interface TouchOptimizedControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetRotation?: () => void;
  onCenterOnUser?: () => void;
  onToggleLayers?: () => void;
  onCompassClick?: () => void;
  className?: string;
  compact?: boolean;
  floating?: boolean;
  position?: 'right' | 'left' | 'center';
}

/**
 * Controles de mapa otimizados para touch
 * Interface adaptativa com feedback tátil e gestos naturais
 */
export function TouchOptimizedControls({
  onZoomIn,
  onZoomOut,
  onResetRotation,
  onCenterOnUser,
  onToggleLayers,
  onCompassClick,
  className = '',
  compact = false,
  floating = true,
  position = 'right',
}: TouchOptimizedControlsProps) {
  const { buttonTap, success } = useHapticFeedback();
  const { gestureState, isGestureActive } = useTouchGestures();

  // Handlers com haptic feedback
  const handleZoomIn = () => {
    buttonTap();
    onZoomIn?.();
    setTimeout(() => success(), 100);
  };

  const handleZoomOut = () => {
    buttonTap();
    onZoomOut?.();
    setTimeout(() => success(), 100);
  };

  const handleResetRotation = () => {
    buttonTap();
    onResetRotation?.();
    setTimeout(() => success(), 200);
  };

  const handleCenterOnUser = () => {
    buttonTap();
    onCenterOnUser?.();
    setTimeout(() => success(), 150);
  };

  const handleToggleLayers = () => {
    buttonTap();
    onToggleLayers?.();
  };

  const handleCompassClick = () => {
    buttonTap();
    onCompassClick?.();
  };

  // Calcula posicionamento
  const getPositionClasses = () => {
    const baseClasses = floating ? 'absolute z-30' : 'relative';
    
    if (!floating) return baseClasses;
    
    switch (position) {
      case 'right':
        return `${baseClasses} top-4 right-4`;
      case 'left':
        return `${baseClasses} top-4 left-4`;
      case 'center':
        return `${baseClasses} top-4 left-1/2 transform -translate-x-1/2`;
      default:
        return `${baseClasses} top-4 right-4`;
    }
  };

  // Tamanho dos botões baseado no modo
  const buttonSize = compact ? 'sm' : 'default';
  const buttonClasses = cn(
    'touch-optimized-button',
    'min-w-[44px] min-h-[44px]', // Minimum touch target size (44px)
    'shadow-lg backdrop-blur-sm',
    'hover:shadow-xl hover:scale-105',
    'active:scale-95 active:shadow-md',
    'transition-all duration-150 ease-out',
    compact ? 'p-2' : 'p-3'
  );

  const controls = [
    {
      id: 'zoom-in',
      icon: ZoomIn,
      label: 'Ampliar',
      action: handleZoomIn,
      disabled: !onZoomIn,
      shortcut: '+',
    },
    {
      id: 'zoom-out',
      icon: ZoomOut,
      label: 'Reduzir',
      action: handleZoomOut,
      disabled: !onZoomOut,
      shortcut: '-',
    },
    {
      id: 'reset-rotation',
      icon: RotateCcw,
      label: 'Resetar rotação',
      action: handleResetRotation,
      disabled: !onResetRotation,
      shortcut: 'R',
    },
    {
      id: 'center-user',
      icon: Target,
      label: 'Centralizar em mim',
      action: handleCenterOnUser,
      disabled: !onCenterOnUser,
      shortcut: 'C',
    },
    {
      id: 'compass',
      icon: Navigation,
      label: 'Bússola',
      action: handleCompassClick,
      disabled: !onCompassClick,
      shortcut: 'N',
    },
    {
      id: 'layers',
      icon: Layers,
      label: 'Camadas',
      action: handleToggleLayers,
      disabled: !onToggleLayers,
      shortcut: 'L',
    },
  ].filter(control => !control.disabled);

  return (
    <div 
      className={cn(
        'touch-optimized-controls',
        getPositionClasses(),
        isGestureActive && 'pointer-events-none opacity-50',
        className
      )}
    >
      {/* Container dos controles */}
      <div 
        className={cn(
          'flex gap-2 p-2',
          'bg-background/80 backdrop-blur-md',
          'border border-border/50 rounded-xl shadow-xl',
          compact ? 'flex-row' : 'flex-col',
          floating && 'max-w-fit'
        )}
      >
        {controls.map((control) => {
          const IconComponent = control.icon;
          
          return (
            <Button
              key={control.id}
              variant="ghost"
              size={buttonSize}
              className={buttonClasses}
              onClick={control.action}
              aria-label={control.label}
              title={`${control.label} (${control.shortcut})`}
            >
              <IconComponent className={cn(
                'text-foreground',
                compact ? 'w-4 h-4' : 'w-5 h-5'
              )} />
            </Button>
          );
        })}
      </div>

      {/* Indicador de gestos ativos */}
      {isGestureActive && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          <div className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-medium whitespace-nowrap">
            Gesture ativo
          </div>
        </div>
      )}

      {/* Feedback visual para zoom */}
      {gestureState.isPinching && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-2 px-3 py-1 bg-background/90 backdrop-blur-sm border border-border rounded-lg text-sm">
            <ZoomIn className="w-3 h-3" />
            <span>Zoom</span>
          </div>
        </div>
      )}

      {/* Feedback visual para rotação */}
      {gestureState.isRotating && !gestureState.isPinching && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-2 px-3 py-1 bg-background/90 backdrop-blur-sm border border-border rounded-lg text-sm">
            <RotateCcw className="w-3 h-3" />
            <span>Rotação</span>
          </div>
        </div>
      )}

      {/* Dicas de uso (apenas em modo não compacto) */}
      {!compact && !isGestureActive && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg p-2 text-xs text-muted-foreground max-w-48">
            <div className="font-medium mb-1">Gestos:</div>
            <div>• Pinch para zoom</div>
            <div>• Dois dedos para rotação</div>
            <div>• Long press para selecionar</div>
          </div>
        </div>
      )}
    </div>
  );
}