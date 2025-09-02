import React, { useCallback } from 'react';
import { 
  Maximize, 
  Minimize, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Navigation,
  Layers,
  Settings
} from 'lucide-react';
import { PremiumButton } from '@/components/ui/premium-button';
import { usePremiumMapAnimations } from '@/hooks/usePremiumMapAnimations';
import { cn } from '@/lib/utils';

interface PremiumMapControlsProps {
  className?: string;
  showStyleSelector?: boolean;
  showResetView?: boolean;
  showFullscreenToggle?: boolean;
  vertical?: boolean;
  onStyleChange?: (style: string) => void;
  onResetView?: () => void;
}

export const PremiumMapControls: React.FC<PremiumMapControlsProps> = ({
  className,
  showStyleSelector = true,
  showResetView = true,
  showFullscreenToggle = true,
  vertical = true,
  onStyleChange,
  onResetView
}) => {
  const {
    isFullscreen,
    fullscreenState,
    showControls,
    animatedEnterFullscreen,
    animatedExitFullscreen,
    getControlPosition,
    getZIndex,
    getContextualClasses,
    animateMapInteraction,
    map
  } = usePremiumMapAnimations();

  const handleZoomIn = useCallback(async () => {
    if (!map) return;
    await animateMapInteraction('zoom');
    map.zoomIn({ duration: 300 });
  }, [map, animateMapInteraction]);

  const handleZoomOut = useCallback(async () => {
    if (!map) return;
    await animateMapInteraction('zoom');
    map.zoomOut({ duration: 300 });
  }, [map, animateMapInteraction]);

  const handleResetView = useCallback(async () => {
    if (!map || !onResetView) return;
    await animateMapInteraction('pan');
    onResetView();
  }, [map, onResetView, animateMapInteraction]);

  const handleFullscreenToggle = useCallback(async () => {
    if (isFullscreen) {
      await animatedExitFullscreen();
    } else {
      await animatedEnterFullscreen();
    }
  }, [isFullscreen, animatedEnterFullscreen, animatedExitFullscreen]);

  // Don't render controls if they're hidden and not transitioning
  if (!showControls && fullscreenState === 'entered') {
    return null;
  }

  const controlPosition = getControlPosition('primary');

  return (
    <div
      className={cn(
        "fixed z-20", // Integrated z-index system
        controlPosition.primary,
        getContextualClasses(),
        vertical ? "flex flex-col" : "flex flex-row",
        "gap-2",
        "transition-all duration-300",
        !showControls && "opacity-0 pointer-events-none",
        className
      )}
      style={{ zIndex: getZIndex('controls') }}
    >
      {/* Zoom Controls */}
      <div 
        className={cn(
          "flex",
          vertical ? "flex-col" : "flex-row",
          "gap-1 p-1 rounded-lg",
          "bg-background/80 backdrop-blur-sm",
          "border border-border/50",
          "shadow-lg premium-card"
        )}
        role="group"
        aria-label="Controles de zoom do mapa"
      >
        <PremiumButton
          variant="ghost"
          size="icon"
          animation="hover"
          onClick={handleZoomIn}
          ariaLabel="Ampliar mapa (Zoom In)"
          className="premium-icon h-12 w-12"
        >
          <ZoomIn className="h-4 w-4" />
        </PremiumButton>
        
        <PremiumButton
          variant="ghost"
          size="icon"
          animation="hover"
          onClick={handleZoomOut}
          ariaLabel="Reduzir mapa (Zoom Out)"
          className="premium-icon h-12 w-12"
        >
          <ZoomOut className="h-4 w-4" />
        </PremiumButton>
      </div>

      {/* Navigation Controls */}
      <div 
        className={cn(
          "flex",
          vertical ? "flex-col" : "flex-row",
          "gap-1 p-1 rounded-lg",
          "bg-background/80 backdrop-blur-sm",
          "border border-border/50",
          "shadow-lg premium-card"
        )}
        role="group"
        aria-label="Controles de navegação do mapa"
      >
        <PremiumButton
          variant="ghost"
          size="icon"
          animation="press"
          onClick={() => animateMapInteraction('rotate')}
          ariaLabel="Rotacionar mapa"
          className="premium-icon h-12 w-12"
        >
          <Navigation className="h-4 w-4" />
        </PremiumButton>
        
        {showResetView && (
          <PremiumButton
            variant="ghost"
            size="icon"
            animation="bounce"
            onClick={handleResetView}
            ariaLabel="Redefinir visualização do mapa para posição inicial"
            className="premium-icon h-12 w-12"
          >
            <RotateCcw className="h-4 w-4" />
          </PremiumButton>
        )}
      </div>

      {/* Style and Settings */}
      {showStyleSelector && (
        <div 
          className={cn(
            "flex",
            vertical ? "flex-col" : "flex-row",
            "gap-1 p-1 rounded-lg",
            "bg-background/80 backdrop-blur-sm",
            "border border-border/50",
            "shadow-lg premium-card"
          )}
          role="group"
          aria-label="Configurações e estilos do mapa"
        >
          <PremiumButton
            variant="ghost"
            size="icon"
            animation="glow"
            onClick={() => onStyleChange?.('satellite')}
            ariaLabel="Alterar para visualização por satélite"
            className="premium-icon h-12 w-12 availability-pulse"
          >
            <Layers className="h-4 w-4" />
          </PremiumButton>
          
          <PremiumButton
            variant="ghost"
            size="icon"
            animation="hover"
            ariaLabel="Abrir configurações do mapa"
            className="premium-icon h-12 w-12"
          >
            <Settings className="h-4 w-4" />
          </PremiumButton>
        </div>
      )}

      {/* Fullscreen Toggle */}
      {showFullscreenToggle && (
        <div 
          className={cn(
            "p-1 rounded-lg",
            "bg-background/80 backdrop-blur-sm",
            "border border-border/50",
            "shadow-lg premium-card"
          )}
          role="group"
          aria-label="Controle de tela cheia"
        >
          <PremiumButton
            variant={isFullscreen ? "premium" : "outline"}
            size="icon"
            animation="full"
            onClick={handleFullscreenToggle}
            disabled={fullscreenState === 'entering' || fullscreenState === 'exiting'}
            ariaLabel={
              isFullscreen 
                ? "Sair do modo tela cheia" 
                : "Entrar no modo tela cheia"
            }
            ariaDescribedBy="fullscreen-description"
            className={cn(
              "premium-icon h-12 w-12",
              fullscreenState === 'entering' && "animate-hover-lift",
              fullscreenState === 'exiting' && "animate-press-down"
            )}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
            <span id="fullscreen-description" className="sr-only">
              {isFullscreen 
                ? "Clique para sair do modo tela cheia e retornar à visualização normal" 
                : "Clique para entrar no modo tela cheia para melhor visualização do mapa"
              }
            </span>
          </PremiumButton>
        </div>
      )}
    </div>
  );
};