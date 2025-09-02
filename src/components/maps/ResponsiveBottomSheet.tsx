import React from 'react';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { ChevronUp, ChevronDown, Grip } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ResponsiveBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnapPoint?: number;
  title?: string;
  persistentMiniMode?: boolean;
  backdropBlur?: boolean;
  onSnapPointChange?: (snapPoint: number) => void;
  className?: string;
}

/**
 * Bottom Sheet responsivo com snap points dinâmicos
 * Otimizado para interação touch com haptic feedback
 */
export function ResponsiveBottomSheet({
  children,
  snapPoints = [20, 50, 85],
  initialSnapPoint = 0,
  title,
  persistentMiniMode = true,
  backdropBlur = true,
  onSnapPointChange,
  className = '',
}: ResponsiveBottomSheetProps) {
  const {
    state,
    open,
    close,
    snapTo,
    snapToNext,
    snapToPrevious,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    sheetRef,
    backdropRef,
    getSnapPointHeight,
    isFullyOpen,
    isMinimized,
    canSnapUp,
    canSnapDown,
    backdropOpacity,
  } = useBottomSheet({
    snapPoints,
    initialSnapPoint,
    persistentMiniMode,
    backdropBlur,
  });

  // Notifica mudanças de snap point
  React.useEffect(() => {
    onSnapPointChange?.(state.currentSnapPoint);
  }, [state.currentSnapPoint, onSnapPointChange]);

  // Abre automaticamente se não estiver em modo persistente
  React.useEffect(() => {
    if (!persistentMiniMode && !state.isOpen) {
      open(initialSnapPoint);
    }
  }, [persistentMiniMode, state.isOpen, open, initialSnapPoint]);

  return (
    <>
      {/* Backdrop */}
      {state.isOpen && backdropBlur && (
        <div
          ref={backdropRef}
          className={cn(
            'fixed inset-0 z-40 transition-opacity duration-300',
            backdropBlur && 'backdrop-blur-sm bg-black/20'
          )}
          style={{
            opacity: backdropOpacity,
          }}
          onClick={() => !isMinimized && close()}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-background border-t border-border rounded-t-xl shadow-xl',
          'transition-transform duration-300 ease-out',
          state.isDragging && 'transition-none',
          className
        )}
        style={{
          height: state.height,
          transform: state.isOpen ? 'translateY(0)' : `translateY(calc(100% - ${getSnapPointHeight(0)}px))`,
        }}
      >
        {/* Drag Handle e Header */}
        <div
          className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          {/* Handle visual */}
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mb-2" />
          
          {/* Header com título e controles */}
          <div className="flex items-center justify-between w-full px-4">
            {title && (
              <h3 className="text-lg font-semibold text-foreground truncate">
                {title}
              </h3>
            )}
            
            <div className="flex items-center gap-2 ml-auto">
              {/* Indicador de snap points */}
              <div className="flex gap-1">
                {snapPoints.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => snapTo(index)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      index === state.currentSnapPoint 
                        ? 'bg-primary' 
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    )}
                    aria-label={`Ir para snap point ${index + 1}`}
                  />
                ))}
              </div>

              {/* Controles de navegação */}
              <div className="flex items-center gap-1">
                {canSnapUp && (
                  <button
                    onClick={snapToNext}
                    className="p-1 rounded-md hover:bg-muted transition-colors"
                    aria-label="Expandir"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                )}
                
                {canSnapDown && (
                  <button
                    onClick={snapToPrevious}
                    className="p-1 rounded-md hover:bg-muted transition-colors"
                    aria-label="Recolher"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                )}
                
                <Grip className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-auto px-4 pb-4">
          {/* Quick Actions Bar - sempre visível no modo mini */}
          {isMinimized && (
            <div className="flex items-center gap-2 py-2 overflow-x-auto">
              <button
                onClick={() => snapToNext()}
                className="flex-shrink-0 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm font-medium"
              >
                Expandir
              </button>
              <div className="text-sm text-muted-foreground truncate">
                Toque para ver mais opções
              </div>
            </div>
          )}

          {/* Conteúdo principal - visível apenas quando não minimizado */}
          {!isMinimized && (
            <div className="space-y-4">
              {children}
            </div>
          )}
        </div>

        {/* Indicator de loading/animação */}
        {state.isAnimating && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20">
            <div className="h-full bg-primary animate-[slideRight_0.3s_ease-out]" />
          </div>
        )}
      </div>
    </>
  );
}