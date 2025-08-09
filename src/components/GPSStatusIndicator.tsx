import React, { useEffect, useRef, useState } from 'react';
import { GPSState } from '@/hooks/useGPSState';

interface GPSStatusIndicatorProps {
  gpsState: GPSState;
  className?: string;
}

export const GPSStatusIndicator: React.FC<GPSStatusIndicatorProps> = ({
  gpsState,
  className = "",
}) => {
  const [visible, setVisible] = useState(false);
  const prevEnabledRef = useRef<boolean | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Show the indicator briefly only when the enabled state changes (not on initial mount)
  useEffect(() => {
    if (prevEnabledRef.current === null) {
      prevEnabledRef.current = gpsState.isEnabled;
      return;
    }

    if (prevEnabledRef.current !== gpsState.isEnabled) {
      prevEnabledRef.current = gpsState.isEnabled;
      setVisible(true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setVisible(false), 2500) as unknown as number;
    }
  }, [gpsState.isEnabled]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`${className} w-3 h-3 rounded-full ${gpsState.isEnabled ? 'bg-success pulse' : 'bg-destructive'} transition-opacity duration-300`}
    />
  );
};