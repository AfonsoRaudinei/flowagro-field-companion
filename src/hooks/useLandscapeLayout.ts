import { useState, useCallback, useEffect } from 'react';
import { useOrientationBehavior } from './useOrientationDetector';

export interface LandscapeLayoutConfig {
  enableSplitView?: boolean;
  sidebarWidth?: number;
  floatingPanels?: boolean;
  compactControls?: boolean;
  horizontalNavigation?: boolean;
}

export interface LandscapeLayoutState {
  isLandscape: boolean;
  isSplitViewActive: boolean;
  sidebarVisible: boolean;
  floatingPanelsEnabled: boolean;
  compactMode: boolean;
  navigationPosition: 'bottom' | 'side';
  availableWidth: number;
  availableHeight: number;
}

/**
 * Hook para gerenciamento inteligente de layout em modo landscape
 * Otimiza a interface para orientação horizontal
 */
export function useLandscapeLayout(config: LandscapeLayoutConfig = {}) {
  const {
    enableSplitView = true,
    sidebarWidth = 320,
    floatingPanels = true,
    compactControls = true,
    horizontalNavigation = true,
  } = config;

  const { orientation, isLandscape: orientationIsLandscape } = useOrientationBehavior();
  
  const [state, setState] = useState<LandscapeLayoutState>({
    isLandscape: orientationIsLandscape,
    isSplitViewActive: false,
    sidebarVisible: false,
    floatingPanelsEnabled: floatingPanels,
    compactMode: false,
    navigationPosition: 'bottom',
    availableWidth: window.innerWidth,
    availableHeight: window.innerHeight,
  });

  // Atualiza estado baseado na orientação
  useEffect(() => {
    const updateLayout = () => {
      const isLandscape = orientationIsLandscape;
      const availableWidth = window.innerWidth;
      const availableHeight = window.innerHeight;
      
      setState(prev => ({
        ...prev,
        isLandscape,
        availableWidth,
        availableHeight,
        isSplitViewActive: isLandscape && enableSplitView && availableWidth > 768,
        compactMode: isLandscape && compactControls,
        navigationPosition: isLandscape && horizontalNavigation ? 'side' : 'bottom',
        floatingPanelsEnabled: isLandscape ? floatingPanels : false,
      }));
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    
    return () => {
      window.removeEventListener('resize', updateLayout);
    };
  }, [orientationIsLandscape, enableSplitView, compactControls, horizontalNavigation, floatingPanels]);

  // Toggle sidebar em modo landscape
  const toggleSidebar = useCallback(() => {
    setState(prev => ({
      ...prev,
      sidebarVisible: !prev.sidebarVisible,
    }));
  }, []);

  // Ativa/desativa split view
  const toggleSplitView = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSplitViewActive: !prev.isSplitViewActive,
    }));
  }, []);

  // Calcula dimensões do mapa em split view
  const getMapDimensions = useCallback(() => {
    if (!state.isSplitViewActive || !state.sidebarVisible) {
      return {
        width: state.availableWidth,
        height: state.availableHeight,
        left: 0,
        top: 0,
      };
    }

    return {
      width: state.availableWidth - sidebarWidth,
      height: state.availableHeight,
      left: sidebarWidth,
      top: 0,
    };
  }, [state.isSplitViewActive, state.sidebarVisible, state.availableWidth, state.availableHeight, sidebarWidth]);

  // Calcula posição para floating panels
  const getFloatingPanelPosition = useCallback((panelId: string, defaultPosition = { x: 20, y: 20 }) => {
    if (!state.floatingPanelsEnabled) {
      return defaultPosition;
    }

    const mapDimensions = getMapDimensions();
    
    // Posiciona painéis em locais estratégicos baseados no ID
    switch (panelId) {
      case 'tools':
        return { x: mapDimensions.left + 20, y: 20 };
      case 'info':
        return { x: mapDimensions.width - 320, y: 20 };
      case 'measurements':
        return { x: mapDimensions.left + 20, y: mapDimensions.height - 200 };
      default:
        return defaultPosition;
    }
  }, [state.floatingPanelsEnabled, getMapDimensions]);

  // CSS classes para diferentes modos
  const getLayoutClasses = useCallback(() => {
    const classes = [];
    
    if (state.isLandscape) {
      classes.push('landscape-mode');
    }
    
    if (state.isSplitViewActive) {
      classes.push('split-view-active');
    }
    
    if (state.compactMode) {
      classes.push('compact-controls');
    }
    
    if (state.floatingPanelsEnabled) {
      classes.push('floating-panels');
    }
    
    return classes.join(' ');
  }, [state]);

  // Configurações de grid para layout responsivo
  const getGridConfig = useCallback(() => {
    if (!state.isLandscape) {
      return {
        columns: 'minmax(0, 1fr)',
        rows: '1fr auto',
        areas: '"main" "navigation"',
      };
    }

    if (state.isSplitViewActive && state.sidebarVisible) {
      return {
        columns: `${sidebarWidth}px minmax(0, 1fr)`,
        rows: '1fr',
        areas: '"sidebar main"',
      };
    }

    return {
      columns: 'minmax(0, 1fr) auto',
      rows: '1fr',
      areas: '"main navigation"',
    };
  }, [state.isLandscape, state.isSplitViewActive, state.sidebarVisible, sidebarWidth]);

  // Configurações específicas para componentes
  const getComponentConfig = useCallback((componentType: string) => {
    switch (componentType) {
      case 'toolbar':
        return {
          orientation: state.isLandscape ? 'vertical' : 'horizontal',
          size: state.compactMode ? 'compact' : 'normal',
          position: state.isLandscape ? 'right' : 'bottom',
        };
      
      case 'navigation':
        return {
          layout: state.navigationPosition === 'side' ? 'vertical' : 'horizontal',
          compact: state.compactMode,
        };
      
      case 'controls':
        return {
          floating: state.floatingPanelsEnabled,
          compact: state.compactMode,
          size: state.isLandscape ? 'small' : 'normal',
        };
      
      default:
        return {};
    }
  }, [state]);

  return {
    // Estado atual
    state,
    
    // Controles
    toggleSidebar,
    toggleSplitView,
    
    // Utilitários de layout
    getMapDimensions,
    getFloatingPanelPosition,
    getLayoutClasses,
    getGridConfig,
    getComponentConfig,
    
    // Informações de contexto
    orientation,
    isLandscapeOptimized: state.isLandscape && (state.isSplitViewActive || state.floatingPanelsEnabled),
    shouldUseFloatingPanels: state.floatingPanelsEnabled,
    shouldUseCompactControls: state.compactMode,
    
    // Dimensões calculadas
    sidebarWidth: state.sidebarVisible ? sidebarWidth : 0,
    mapWidth: getMapDimensions().width,
    mapHeight: getMapDimensions().height,
  };
}