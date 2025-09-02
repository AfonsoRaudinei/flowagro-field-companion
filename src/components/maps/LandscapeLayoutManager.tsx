import React from 'react';
import { useLandscapeLayout } from '../../hooks/useLandscapeLayout';
import { Menu, X, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

export interface LandscapeLayoutManagerProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  navigation?: React.ReactNode;
  enableSplitView?: boolean;
  sidebarWidth?: number;
  className?: string;
}

/**
 * Gerenciador de layout otimizado para modo landscape
 * Implementa split view, painéis flutuantes e navegação adaptativa
 */
export function LandscapeLayoutManager({
  children,
  sidebar,
  navigation,
  enableSplitView = true,
  sidebarWidth = 320,
  className = '',
}: LandscapeLayoutManagerProps) {
  const {
    state,
    toggleSidebar,
    toggleSplitView,
    getMapDimensions,
    getLayoutClasses,
    getGridConfig,
    getComponentConfig,
    isLandscapeOptimized,
    shouldUseFloatingPanels,
    shouldUseCompactControls,
  } = useLandscapeLayout({
    enableSplitView,
    sidebarWidth,
    floatingPanels: true,
    compactControls: true,
    horizontalNavigation: true,
  });

  const gridConfig = getGridConfig();
  const mapDimensions = getMapDimensions();
  const toolbarConfig = getComponentConfig('toolbar');
  const navigationConfig = getComponentConfig('navigation');

  return (
    <div 
      className={cn('landscape-layout-manager relative w-full h-full', getLayoutClasses(), className)}
      style={{
        display: 'grid',
        gridTemplateColumns: gridConfig.columns,
        gridTemplateRows: gridConfig.rows,
        gridTemplateAreas: gridConfig.areas,
      }}
    >
      {/* Sidebar - apenas em landscape com split view */}
      {state.isLandscape && state.isSplitViewActive && state.sidebarVisible && sidebar && (
        <div 
          className="sidebar-container bg-background border-r border-border overflow-hidden"
          style={{ gridArea: 'sidebar', width: sidebarWidth }}
        >
          {/* Header da Sidebar */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Ferramentas</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Conteúdo da Sidebar */}
          <div className="flex-1 overflow-auto">
            {sidebar}
          </div>
        </div>
      )}

      {/* Área Principal do Mapa */}
      <div 
        className="main-container relative"
        style={{ 
          gridArea: 'main',
          width: mapDimensions.width,
          height: mapDimensions.height,
        }}
      >
        {/* Controles de Layout - sempre visíveis */}
        <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
          {/* Toggle Sidebar em Landscape */}
          {state.isLandscape && enableSplitView && (
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleSidebar}
              className={cn(
                'h-8 w-8 p-0 bg-background/80 backdrop-blur-sm',
                state.sidebarVisible && 'bg-primary text-primary-foreground'
              )}
            >
              <Menu className="w-4 h-4" />
            </Button>
          )}

          {/* Toggle Split View */}
          {state.isLandscape && (
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleSplitView}
              className={cn(
                'h-8 px-2 bg-background/80 backdrop-blur-sm text-xs',
                state.isSplitViewActive && 'bg-primary text-primary-foreground'
              )}
            >
              Split
            </Button>
          )}

          {/* Indicador de Modo */}
          <div className="px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-xs text-muted-foreground">
            {isLandscapeOptimized ? 'Landscape' : 'Portrait'}
          </div>
        </div>

        {/* Área do Mapa */}
        <div className="relative w-full h-full">
          {children}
        </div>

        {/* Toolbar Flutuante em Landscape */}
        {shouldUseFloatingPanels && state.isLandscape && (
          <div className="absolute top-4 right-4 z-40">
            <div 
              className={cn(
                'bg-background/90 backdrop-blur-sm border border-border rounded-lg shadow-lg p-2',
                toolbarConfig.orientation === 'vertical' ? 'flex flex-col gap-1' : 'flex gap-1'
              )}
            >
              <Button variant="ghost" size={shouldUseCompactControls ? 'sm' : 'default'} className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Controles Compactos para Landscape */}
        {shouldUseCompactControls && state.isLandscape && (
          <div className="absolute bottom-4 right-4 z-40">
            <div className="flex flex-col gap-2">
              {/* Controles compactos específicos */}
            </div>
          </div>
        )}
      </div>

      {/* Navegação */}
      {navigation && (
        <div 
          className={cn(
            'navigation-container',
            navigationConfig.layout === 'vertical' ? 'flex flex-col' : 'flex flex-row',
            state.isLandscape && state.navigationPosition === 'side' ? 'border-l border-border' : 'border-t border-border'
          )}
          style={{ gridArea: 'navigation' }}
        >
          {navigation}
        </div>
      )}

      {/* Overlay para transições */}
      {state.isLandscape && (
        <div 
          className={cn(
            'fixed inset-0 bg-background/50 backdrop-blur-sm z-30 transition-opacity duration-300',
            state.isSplitViewActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}
        />
      )}

      {/* Indicadores de Estado */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
        {isLandscapeOptimized && (
          <div className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">
            Modo Landscape Ativo
          </div>
        )}
        
        {state.isSplitViewActive && (
          <div className="px-2 py-1 bg-secondary/20 text-secondary-foreground rounded text-xs font-medium">
            Split View
          </div>
        )}
      </div>
    </div>
  );
}