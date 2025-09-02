import React, { useEffect } from 'react';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { ChevronUp, ChevronDown, Grip, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export interface ResponsiveBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnapPoint?: number;
  title?: string;
  status?: string;
  isActive?: boolean;
  persistentMiniMode?: boolean;
  backdropBlur?: boolean;
  onSnapPointChange?: (snapPoint: number) => void;
  onClose?: () => void;
  showFooter?: boolean;
  footerActions?: React.ReactNode;
  className?: string;
}

/**
 * Bottom Sheet responsivo com comportamento mobile-first
 * Snap points: 20vh, 50vh, 80vh
 * Safe areas, gestos nativos e teclado otimizado
 */
export function ResponsiveBottomSheet({
  children,
  snapPoints = [20, 50, 80],
  initialSnapPoint = 1,
  title,
  status,
  isActive,
  persistentMiniMode = false,
  backdropBlur = true,
  onSnapPointChange,
  onClose,
  showFooter = false,
  footerActions,
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
  useEffect(() => {
    onSnapPointChange?.(state.currentSnapPoint);
  }, [state.currentSnapPoint, onSnapPointChange]);

  // Abre automaticamente se não estiver em modo persistente
  useEffect(() => {
    if (!persistentMiniMode && !state.isOpen) {
      open(initialSnapPoint);
    }
  }, [persistentMiniMode, state.isOpen, open, initialSnapPoint]);

  // Lock body scroll quando aberto
  useEffect(() => {
    if (state.isOpen && !isMinimized) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = 'var(--scrollbar-width, 0px)';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [state.isOpen, isMinimized]);

  // Keyboard handling (Esc para fechar)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && state.isOpen) {
        handleClose();
      }
    };

    if (state.isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [state.isOpen]);

  // Viewport height adjustment para teclado mobile
  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClose = () => {
    close();
    onClose?.();
  };

  const getMaxHeight = () => {
    const isMobile = window.innerWidth <= 480;
    const isSmallMobile = window.innerWidth <= 390; // Target small screens
    
    if (isSmallMobile) {
      return 'calc(90vh - env(safe-area-inset-bottom))'; // Very small screens
    }
    
    return isMobile ? 'calc(85vh - env(safe-area-inset-bottom))' : '70vh';
  };

  return (
    <>
      {/* Backdrop */}
      {state.isOpen && backdropBlur && (
        <div
          ref={backdropRef}
          className={cn(
            'fixed inset-0 transition-opacity duration-300 ease-out',
            'bg-black/20 backdrop-blur-sm',
            'z-40' // Acima do mapa (z-30), abaixo de toasts (z-50)
          )}
          style={{
            opacity: backdropOpacity,
          }}
          onClick={() => !isMinimized && handleClose()}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0',
          'bg-background border-t border-border rounded-t-2xl shadow-2xl',
          'transition-transform duration-300 ease-out',
          'z-50', // Acima do backdrop, abaixo de toasts
          state.isDragging && 'transition-none',
          className
        )}
        style={{
          height: state.height,
          maxHeight: getMaxHeight(),
          transform: state.isOpen ? 'translateY(0)' : `translateY(calc(100% - ${getSnapPointHeight(0)}px))`,
          paddingBottom: 'env(safe-area-inset-bottom)', // iOS safe area
          // Ensure proper containment on small screens
          minWidth: '100vw',
          maxWidth: '100vw',
        }}
      >
        {/* Drag Handle e Header */}
        <div
          className="flex flex-col pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          {/* Handle visual */}
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-3 transition-colors duration-200 hover:bg-muted-foreground/50" />
          
          {/* Header com título, status e controles */}
          <div className="flex items-center justify-between px-4 pb-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {title && (
                <h3 className="text-lg font-semibold text-foreground truncate">
                  {title}
                </h3>
              )}
              
              {status && (
                <Badge 
                  variant={isActive ? "default" : "secondary"}
                  className={cn(
                    "text-xs font-medium",
                    isActive ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  {status}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Indicador de snap points */}
              <div className="flex gap-1">
                {snapPoints.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => snapTo(index)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-200',
                      index === state.currentSnapPoint 
                        ? 'bg-primary scale-125' 
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 hover:scale-110'
                    )}
                    aria-label={`Snap point ${index + 1}`}
                  />
                ))}
              </div>

              {/* Controles de navegação */}
              <div className="flex items-center gap-1">
                {canSnapUp && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={snapToNext}
                    className="h-8 w-8 p-0 hover:bg-muted"
                    aria-label="Expandir"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                )}
                
                {canSnapDown && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={snapToPrevious}
                    className="h-8 w-8 p-0 hover:bg-muted"
                    aria-label="Recolher"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                )}
                
                {/* Botão fechar */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-border/50 mx-4" />

        {/* Conteúdo Principal */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Quick Actions Bar - sempre visível no modo mini */}
          {isMinimized && (
            <div className="flex items-center gap-2 p-4 border-b border-border/30">
              <Button
                variant="outline"
                size="sm"
                onClick={() => snapToNext()}
                className="flex-shrink-0"
              >
                <ChevronUp className="w-3 h-3 mr-1" />
                Expandir
              </Button>
              <div className="text-sm text-muted-foreground truncate">
                Toque para ver mais opções
              </div>
            </div>
          )}

          {/* Conteúdo scrollável - visível apenas quando não minimizado */}
          {!isMinimized && (
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 max-h-[calc(80vh-120px)]">
              <div className="space-y-4 pb-safe min-h-0">
                {children}
              </div>
            </div>
          )}

          {/* Footer com ações primárias */}
          {!isMinimized && showFooter && footerActions && (
            <div className="border-t border-border/30 p-4 bg-background/95 backdrop-blur-sm">
              <div className="flex gap-2 justify-end">
                {footerActions}
              </div>
            </div>
          )}
        </div>

        {/* Indicator de loading/animação */}
        {state.isAnimating && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden">
            <div className="h-full bg-primary animate-[slideRight_0.3s_ease-out] w-full origin-left" />
          </div>
        )}

        {/* Resize handle para desktop */}
        <div className="hidden md:block absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1">
          <Grip className="w-4 h-4 text-muted-foreground/50" />
        </div>
      </div>
    </>
  );
}