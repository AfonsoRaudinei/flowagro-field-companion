import { useCallback } from 'react';

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

export interface HapticPattern {
  impact: 'light' | 'medium' | 'heavy';
  delay?: number;
}

// Type declarations for Capacitor
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform(): boolean;
    };
  }
}

/**
 * Hook para haptic feedback em dispositivos móveis
 * Suporta Capacitor Haptics e Web Vibration API como fallback
 */
export function useHapticFeedback() {
  
  const triggerHaptic = useCallback(async (type: HapticFeedbackType) => {
    // Check if we're in a Capacitor environment first
    if (window.Capacitor?.isNativePlatform?.()) {
      try {
        const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
        
        switch (type) {
          case 'light':
            await Haptics.impact({ style: ImpactStyle.Light });
            break;
          case 'medium':
            await Haptics.impact({ style: ImpactStyle.Medium });
            break;
          case 'heavy':
            await Haptics.impact({ style: ImpactStyle.Heavy });
            break;
          case 'selection':
            await Haptics.selectionStart();
            await Haptics.selectionChanged();
            await Haptics.selectionEnd();
            break;
          case 'success':
            await Haptics.notification({ type: NotificationType.Success });
            break;
          case 'warning':
            await Haptics.notification({ type: NotificationType.Warning });
            break;
          case 'error':
            await Haptics.notification({ type: NotificationType.Error });
            break;
        }
        return;
      } catch (error) {
        console.warn('Capacitor Haptics not available, falling back to vibration API');
      }
    }

    // Fallback to Web Vibration API
    if ('vibrate' in navigator) {
      const patterns: Record<HapticFeedbackType, number | number[]> = {
        light: 10,
        medium: 20,
        heavy: 50,
        selection: [10, 10, 10],
        success: [10, 50, 10],
        warning: [50, 50, 50],
        error: [100, 50, 100, 50, 100]
      };

      navigator.vibrate(patterns[type]);
    }
  }, []);

  const triggerCustomPattern = useCallback(async (patterns: HapticPattern[]) => {
    for (const pattern of patterns) {
      await triggerHaptic(pattern.impact);
      if (pattern.delay) {
        await new Promise(resolve => setTimeout(resolve, pattern.delay));
      }
    }
  }, [triggerHaptic]);

  // Haptic feedback for common UI interactions
  const buttonPress = useCallback(() => triggerHaptic('medium'), [triggerHaptic]);
  const buttonTap = useCallback(() => triggerHaptic('light'), [triggerHaptic]);
  const longPress = useCallback(() => triggerHaptic('heavy'), [triggerHaptic]);
  const selection = useCallback(() => triggerHaptic('selection'), [triggerHaptic]);
  const success = useCallback(() => triggerHaptic('success'), [triggerHaptic]);
  const error = useCallback(() => triggerHaptic('error'), [triggerHaptic]);
  const warning = useCallback(() => triggerHaptic('warning'), [triggerHaptic]);

  // Premium animation haptic sequences
  const hoverEnter = useCallback(() => triggerHaptic('light'), [triggerHaptic]);
  const pressDown = useCallback(() => triggerHaptic('medium'), [triggerHaptic]);
  const releaseUp = useCallback(() => triggerHaptic('light'), [triggerHaptic]);
  
  const premiumPress = useCallback(async () => {
    await triggerHaptic('medium');
    setTimeout(() => triggerHaptic('light'), 100);
  }, [triggerHaptic]);

  return {
    // Core haptic functions
    triggerHaptic,
    triggerCustomPattern,
    
    // Common UI haptics
    buttonPress,
    buttonTap,
    longPress,
    selection,
    success,
    error,
    warning,
    
    // Premium animation haptics
    hoverEnter,
    pressDown,
    releaseUp,
    premiumPress,
  };
}