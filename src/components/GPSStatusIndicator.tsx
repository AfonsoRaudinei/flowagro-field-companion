import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, MapPinOff, Loader2 } from 'lucide-react';
import { GPSState } from '@/hooks/useGPSState';

interface GPSStatusIndicatorProps {
  gpsState: GPSState;
  className?: string;
}

export const GPSStatusIndicator: React.FC<GPSStatusIndicatorProps> = ({ 
  gpsState, 
  className = "" 
}) => {
  const getStatusInfo = () => {
    if (gpsState.isChecking) {
      return {
        icon: Loader2,
        text: "Verificando GPS...",
        variant: "secondary" as const,
        className: "animate-spin"
      };
    }

    if (!gpsState.isEnabled) {
      return {
        icon: MapPinOff,
        text: "GPS Inativo",
        variant: "destructive" as const,
        className: "animate-pulse"
      };
    }

    const accuracyText = {
      'high': 'GPS Alta Precisão',
      'medium': 'GPS Média Precisão', 
      'low': 'GPS Baixa Precisão',
      'unknown': 'GPS Ativo'
    }[gpsState.accuracy];

    const sourceText = {
      'gps': 'Localização Atual',
      'cache': 'Localização em Cache',
      'map-center': 'Centro do Mapa',
      'none': 'Sem Localização'
    }[gpsState.source];

    return {
      icon: MapPin,
      text: accuracyText,
      variant: gpsState.accuracy === 'high' ? 'default' as const : 'secondary' as const,
      className: "",
      detail: sourceText
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={statusInfo.variant}
            className={`
              ${className} 
              flex items-center gap-1 text-xs font-medium
              transition-all duration-300
            `}
          >
            <Icon className={`w-3 h-3 ${statusInfo.className}`} />
            <span className="hidden sm:inline">{statusInfo.text}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{statusInfo.text}</p>
            {statusInfo.detail && (
              <p className="text-xs text-muted-foreground">{statusInfo.detail}</p>
            )}
            {gpsState.lastLocation && (
              <p className="text-xs text-muted-foreground">
                Última atualização: {gpsState.lastCheck.toLocaleTimeString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};