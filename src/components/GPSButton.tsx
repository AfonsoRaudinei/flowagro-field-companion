import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GPSState } from '@/hooks/useGPSState';

interface GPSButtonProps {
  gpsState: GPSState;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
  requiresGPS?: boolean;
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const GPSButton: React.FC<GPSButtonProps> = ({
  gpsState,
  icon,
  onClick,
  disabled = false,
  tooltip,
  requiresGPS = true,
  children,
  className = "",
  variant = "outline",
  size = "icon"
}) => {
  const isGPSDisabled = requiresGPS && !gpsState.isEnabled;
  const isButtonDisabled = disabled || isGPSDisabled;

  const getTooltipText = () => {
    if (tooltip) return tooltip;
    if (isGPSDisabled) return "GPS necessário - ative nas configurações";
    return undefined;
  };

  const buttonContent = (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={isButtonDisabled}
      className={`
        ${className}
        transition-all duration-300
        ${isGPSDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${requiresGPS && !gpsState.isEnabled ? 'animate-pulse' : ''}
        ${gpsState.isChecking ? 'animate-pulse' : ''}
      `}
    >
      <div className={`${isGPSDisabled ? 'opacity-60' : ''}`}>
        {icon}
      </div>
      {children}
      {isGPSDisabled && (
        <div className="absolute inset-0 bg-destructive/20 rounded-md flex items-center justify-center">
          <div className="w-1 h-1 bg-destructive rounded-full animate-ping" />
        </div>
      )}
    </Button>
  );

  if (getTooltipText()) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
};