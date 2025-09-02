import { useState, useCallback, useRef, useEffect } from 'react';
import { useHapticFeedback } from './useHapticFeedback';

export interface FloatingAction {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: () => void;
  shortcut?: string;
  disabled?: boolean;
  primary?: boolean;
  contextual?: boolean;
}

export interface FloatingActionsState {
  isExpanded: boolean;
  primaryAction: FloatingAction | null;
  contextualActions: FloatingAction[];
  allActions: FloatingAction[];
  isAnimating: boolean;
}

export interface FloatingActionsConfig {
  maxVisibleActions?: number;
  expandOnHover?: boolean;
  contextSensitive?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoHide?: boolean;
  autoHideDelay?: number;
}

/**
 * Hook para gerenciar Floating Action Buttons contextuais
 * Adaptam-se ao contexto da aplicação e fornecem ações rápidas
 */
export function useFloatingActions(
  actions: FloatingAction[],
  config: FloatingActionsConfig = {}
) {
  const {
    maxVisibleActions = 4,
    expandOnHover = true,
    contextSensitive = true,
    position = 'bottom-right',
    autoHide = false,
    autoHideDelay = 3000,
  } = config;

  const { buttonTap, selection, success } = useHapticFeedback();

  const [state, setState] = useState<FloatingActionsState>({
    isExpanded: false,
    primaryAction: null,
    contextualActions: [],
    allActions: actions,
    isAnimating: false,
  });

  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filtra ações baseado no contexto
  const updateContextualActions = useCallback(() => {
    if (!contextSensitive) {
      setState(prev => ({
        ...prev,
        allActions: actions,
        contextualActions: actions.filter(a => !a.primary),
        primaryAction: actions.find(a => a.primary) || actions[0] || null,
      }));
      return;
    }

    // Filtra ações contextuais (não desabilitadas)
    const availableActions = actions.filter(action => !action.disabled);
    
    // Separa ação primária
    const primary = availableActions.find(action => action.primary) || availableActions[0] || null;
    
    // Ações contextuais (excluindo a primária)
    const contextual = availableActions
      .filter(action => action !== primary)
      .slice(0, maxVisibleActions - 1);

    setState(prev => ({
      ...prev,
      allActions: availableActions,
      primaryAction: primary,
      contextualActions: contextual,
    }));
  }, [actions, contextSensitive, maxVisibleActions]);

  // Atualiza ações quando props mudam
  useEffect(() => {
    updateContextualActions();
  }, [updateContextualActions]);

  // Expande o menu
  const expand = useCallback(() => {
    setState(prev => ({ ...prev, isExpanded: true, isAnimating: true }));
    selection(); // Haptic feedback
    
    // Remove animação após delay
    setTimeout(() => {
      setState(prev => ({ ...prev, isAnimating: false }));
    }, 200);

    // Cancela timer de auto-hide
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, [selection]);

  // Recolhe o menu
  const collapse = useCallback(() => {
    setState(prev => ({ ...prev, isExpanded: false, isAnimating: true }));
    
    setTimeout(() => {
      setState(prev => ({ ...prev, isAnimating: false }));
    }, 200);
  }, []);

  // Toggle expand/collapse
  const toggle = useCallback(() => {
    if (state.isExpanded) {
      collapse();
    } else {
      expand();
    }
  }, [state.isExpanded, expand, collapse]);

  // Executa ação
  const executeAction = useCallback((action: FloatingAction) => {
    if (action.disabled) return;
    
    buttonTap(); // Haptic feedback
    action.action();
    
    // Recolhe após executar ação (opcional)
    if (state.isExpanded) {
      setTimeout(() => collapse(), 100);
    }
    
    success(); // Haptic feedback de sucesso
  }, [state.isExpanded, buttonTap, success, collapse]);

  // Auto-hide functionality
  const resetAutoHide = useCallback(() => {
    if (!autoHide) return;
    
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    
    hideTimer.current = setTimeout(() => {
      if (state.isExpanded) {
        collapse();
      }
    }, autoHideDelay);
  }, [autoHide, autoHideDelay, state.isExpanded, collapse]);

  // Handlers para hover (desktop)
  const handleMouseEnter = useCallback(() => {
    if (expandOnHover && !state.isExpanded) {
      expand();
    }
    resetAutoHide();
  }, [expandOnHover, state.isExpanded, expand, resetAutoHide]);

  const handleMouseLeave = useCallback(() => {
    if (expandOnHover && state.isExpanded) {
      // Delay antes de recolher em hover
      setTimeout(() => {
        if (!containerRef.current?.matches(':hover')) {
          collapse();
        }
      }, 500);
    }
  }, [expandOnHover, state.isExpanded, collapse]);

  // Handlers para touch (mobile)
  const handleTouchStart = useCallback(() => {
    resetAutoHide();
  }, [resetAutoHide]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, []);

  // Calcula posições das ações expandidas
  const getActionPositions = useCallback(() => {
    if (!state.isExpanded) return [];
    
    const positions = [];
    const angleStep = 90 / Math.max(state.contextualActions.length - 1, 1);
    const radius = 60;
    
    state.contextualActions.forEach((_, index) => {
      const angle = (index * angleStep - 45) * (Math.PI / 180);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      positions.push({ x, y });
    });
    
    return positions;
  }, [state.isExpanded, state.contextualActions.length]);

  // Calcula classes CSS baseadas na posição
  const getPositionClasses = useCallback(() => {
    const baseClasses = 'fixed z-50';
    
    switch (position) {
      case 'bottom-right':
        return `${baseClasses} bottom-6 right-6`;
      case 'bottom-left':
        return `${baseClasses} bottom-6 left-6`;
      case 'top-right':
        return `${baseClasses} top-6 right-6`;
      case 'top-left':
        return `${baseClasses} top-6 left-6`;
      default:
        return `${baseClasses} bottom-6 right-6`;
    }
  }, [position]);

  return {
    // Estado
    state,
    
    // Controles
    expand,
    collapse,
    toggle,
    executeAction,
    
    // Event handlers
    handleMouseEnter,
    handleMouseLeave,
    handleTouchStart,
    
    // Utilitários
    getActionPositions,
    getPositionClasses,
    containerRef,
    
    // Informações
    hasActions: state.allActions.length > 0,
    hasPrimaryAction: state.primaryAction !== null,
    hasContextualActions: state.contextualActions.length > 0,
    visibleActionsCount: state.contextualActions.length + (state.primaryAction ? 1 : 0),
  };
}