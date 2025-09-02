import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Camera, 
  Settings, 
  Layers,
  Zap,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface QuickActionsBarProps {
  showLayersToggle?: boolean;
  showCamera?: boolean;
  showSettings?: boolean;
  onCameraClick?: () => void;
  onLayersClick?: () => void;
  onSettingsClick?: () => void;
  activePins?: number;
  ndviActive?: boolean;
  className?: string;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  showLayersToggle = true,
  showCamera = true, 
  showSettings = true,
  onCameraClick,
  onLayersClick,
  onSettingsClick,
  activePins = 0,
  ndviActive = false,
  className
}) => {
  const navigate = useNavigate();

  return (
    <div className={cn(
      "absolute top-4 left-4 z-40",
      "flex items-center space-x-2",
      className
    )}>
      {/* Botão Voltar */}
      <Button
        variant="secondary"
        size="icon"
        onClick={() => navigate(-1)}
        className={cn(
          "h-10 w-10 rounded-xl shadow-lg",
          "bg-background/90 backdrop-blur-sm border border-border/50",
          "hover:bg-background hover:shadow-xl",
          "transition-all duration-200"
        )}
        aria-label="Voltar"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>

      {/* Separador visual */}
      <div className="w-px h-6 bg-border/50" />

      {/* Quick Actions */}
      <div className="flex items-center space-x-1">
        {showLayersToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onLayersClick}
            className={cn(
              "h-10 w-10 rounded-xl",
              "bg-background/70 backdrop-blur-sm border border-border/30",
              "hover:bg-primary/10 hover:border-primary/30",
              "transition-all duration-200 relative"
            )}
            aria-label="Toggle camadas"
          >
            <Layers className="w-5 h-5" />
            
            {/* Indicadores de status */}
            {ndviActive && (
              <div className="absolute -top-1 -right-1">
                <div className="h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
              </div>
            )}
          </Button>
        )}

        {showCamera && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCameraClick}
            className={cn(
              "h-10 w-10 rounded-xl",
              "bg-background/70 backdrop-blur-sm border border-border/30",
              "hover:bg-primary/10 hover:border-primary/30",
              "transition-all duration-200"
            )}
            aria-label="Capturar foto"
          >
            <Camera className="w-5 h-5" />
          </Button>
        )}

        {/* Pins Counter */}
        {activePins > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-10 px-3 rounded-xl",
              "bg-background/70 backdrop-blur-sm border border-border/30",
              "hover:bg-primary/10 hover:border-primary/30",
              "transition-all duration-200"
            )}
            aria-label={`${activePins} pins ativos`}
          >
            <MapPin className="w-4 h-4 mr-1" />
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {activePins}
            </Badge>
          </Button>
        )}

        {showSettings && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className={cn(
              "h-10 w-10 rounded-xl",
              "bg-background/70 backdrop-blur-sm border border-border/30",
              "hover:bg-primary/10 hover:border-primary/30",
              "transition-all duration-200"
            )}
            aria-label="Configurações"
          >
            <Settings className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Status Indicators */}
      <div className="flex items-center space-x-1">
        {ndviActive && (
          <div className={cn(
            "px-2 py-1 rounded-lg text-xs font-medium",
            "bg-green-500/10 text-green-700 border border-green-200/50",
            "backdrop-blur-sm"
          )}>
            <div className="flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span>NDVI Live</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};