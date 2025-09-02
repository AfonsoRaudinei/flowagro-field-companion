import { useEffect, useState, useCallback } from 'react';

interface AccessibilityState {
  reducedMotion: boolean;
  highContrast: boolean;
  focusVisible: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

/**
 * Hook para detectar e gerenciar preferências de acessibilidade do usuário
 */
export function useAccessibility() {
  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    reducedMotion: false,
    highContrast: false,
    focusVisible: false,
    screenReader: false,
    keyboardNavigation: false
  });

  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  // Detectar preferências de movimento reduzido
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = () => {
      setAccessibilityState(prev => ({
        ...prev,
        reducedMotion: mediaQuery.matches
      }));
    };

    handleChange(); // Check initial state
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Detectar preferências de alto contraste
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleChange = () => {
      setAccessibilityState(prev => ({
        ...prev,
        highContrast: mediaQuery.matches
      }));
    };

    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Detectar navegação por teclado
  useEffect(() => {
    let isKeyboard = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab, Arrow keys, Enter, Space indicate keyboard usage
      if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(event.key)) {
        isKeyboard = true;
        setIsKeyboardUser(true);
        setAccessibilityState(prev => ({
          ...prev,
          keyboardNavigation: true,
          focusVisible: true
        }));
      }
    };

    const handleMouseDown = () => {
      if (isKeyboard) {
        isKeyboard = false;
        setIsKeyboardUser(false);
        setAccessibilityState(prev => ({
          ...prev,
          keyboardNavigation: false,
          focusVisible: false
        }));
      }
    };

    // Detect screen reader usage
    const handleFocus = () => {
      // Screen readers often trigger focus events differently
      if (document.activeElement && !isKeyboard) {
        setAccessibilityState(prev => ({
          ...prev,
          screenReader: true
        }));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('focusin', handleFocus);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('focusin', handleFocus);
    };
  }, []);

  // Utility functions for accessibility
  const getAccessibilityClasses = useCallback(() => {
    const classes = [];
    
    if (accessibilityState.reducedMotion) {
      classes.push('motion-reduce');
    }
    
    if (accessibilityState.highContrast) {
      classes.push('high-contrast');
    }
    
    if (accessibilityState.focusVisible || isKeyboardUser) {
      classes.push('focus-visible-mode');
    }
    
    return classes.join(' ');
  }, [accessibilityState, isKeyboardUser]);

  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  const createAccessibleLabel = useCallback((
    baseLabel: string,
    additionalInfo?: string,
    state?: 'pressed' | 'expanded' | 'selected'
  ) => {
    let label = baseLabel;
    
    if (additionalInfo) {
      label += `, ${additionalInfo}`;
    }
    
    if (state) {
      const stateMap = {
        pressed: 'pressionado',
        expanded: 'expandido',
        selected: 'selecionado'
      };
      label += `, ${stateMap[state]}`;
    }
    
    return label;
  }, []);

  const createSkipLink = useCallback((targetId: string, label: string = 'Pular para conteúdo principal') => {
    return {
      href: `#${targetId}`,
      className: 'skip-link',
      'aria-label': label,
      onFocus: () => announceToScreenReader(`Link de navegação: ${label}`)
    };
  }, [announceToScreenReader]);

  // Color contrast utilities
  const ensureContrast = useCallback((foreground: string, background: string) => {
    if (accessibilityState.highContrast) {
      // Return high contrast versions
      return {
        foreground: foreground === 'light' ? '#000000' : '#FFFFFF',
        background: background === 'light' ? '#FFFFFF' : '#000000'
      };
    }
    return { foreground, background };
  }, [accessibilityState.highContrast]);

  return {
    // State
    ...accessibilityState,
    isKeyboardUser,
    
    // Utilities
    getAccessibilityClasses,
    announceToScreenReader,
    createAccessibleLabel,
    createSkipLink,
    ensureContrast,
    
    // Touch target helpers
    getTouchTargetSize: () => accessibilityState.screenReader ? '48px' : '44px',
    getMinimumTouchTarget: () => ({ minHeight: '44px', minWidth: '44px' }),
    
    // Animation preferences
    shouldReduceMotion: () => accessibilityState.reducedMotion,
    getAnimationDuration: (normalDuration: number) => 
      accessibilityState.reducedMotion ? 0 : normalDuration,
      
    // Focus management
    shouldShowFocusRing: () => accessibilityState.focusVisible || isKeyboardUser,
    getFocusRingClasses: () => 
      accessibilityState.focusVisible || isKeyboardUser 
        ? 'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2' 
        : '',
  };
}