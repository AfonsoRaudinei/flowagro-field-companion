import React from 'react';
import { ZoomLevelIndicator } from './ZoomLevelIndicator';
import { CompassControl } from './CompassControl';
import { UserLocationTracker } from './UserLocationTracker';
import { MiniMapNavigator } from './MiniMapNavigator';
import { cn } from '@/lib/utils';

interface NavigationControlsHubProps {
  className?: string;
  showZoomIndicator?: boolean;
  showCompass?: boolean;
  showLocationTracker?: boolean;
  showMiniMap?: boolean;
  layout?: 'default' | 'compact' | 'mobile';
}

export const NavigationControlsHub: React.FC<NavigationControlsHubProps> = ({
  className,
  showZoomIndicator = true,
  showCompass = true,
  showLocationTracker = true,
  showMiniMap = true,
  layout = 'default'
}) => {
  const isCompact = layout === 'compact' || layout === 'mobile';
  
  return (
    <div
      className={cn(
        "relative w-full h-full",
        className
      )}
    >
      {/* Zoom Level Indicator */}
      {showZoomIndicator && (
        <ZoomLevelIndicator
          className={cn(
            isCompact && "top-2 right-2",
            layout === 'mobile' && "scale-90"
          )}
          showZoomButtons={layout !== 'compact'}
          showPresets={layout === 'default'}
        />
      )}

      {/* Compass Control */}
      {showCompass && (
        <CompassControl
          className={cn(
            isCompact && "top-2 right-20",
            layout === 'mobile' && "scale-90"
          )}
          autoReset={true}
          showResetButton={layout !== 'compact'}
          showMagneticDeclination={layout === 'default'}
        />
      )}

      {/* Mini Map Navigator */}
      {showMiniMap && (
        <MiniMapNavigator
          className={cn(
            isCompact && "top-2 left-2",
            layout === 'mobile' && "scale-90"
          )}
          width={isCompact ? 120 : 160}
          height={isCompact ? 90 : 120}
          showToggle={layout !== 'compact'}
          defaultVisible={layout === 'default'}
        />
      )}

      {/* User Location Tracker */}
      {showLocationTracker && (
        <UserLocationTracker
          className={cn(
            isCompact && "bottom-2 right-2",
            layout === 'mobile' && "scale-90"
          )}
          showAccuracyCircle={layout !== 'compact'}
          showTrail={layout !== 'compact'}
          showSpeed={layout === 'default'}
          showFollowButton={true}
          maxTrailPoints={isCompact ? 5 : 10}
        />
      )}

      {/* Layout-specific adjustments */}
      {layout === 'mobile' && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-background/90 backdrop-blur-sm border border-border/50 rounded-full px-3 py-1">
            <div className="text-xs text-muted-foreground text-center">
              Controles de Navegação Ativos
            </div>
          </div>
        </div>
      )}
    </div>
  );
};