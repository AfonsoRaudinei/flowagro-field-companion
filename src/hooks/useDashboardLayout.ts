import { useState, useCallback, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Specialized hook for dashboard layout management
 * Handles chat expansion, sidebar visibility, and responsive layout
 */
export function useDashboardLayout() {
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const isMobile = useIsMobile();

  const expandChat = useCallback(() => {
    setIsChatExpanded(true);
  }, []);

  const collapseChat = useCallback(() => {
    setIsChatExpanded(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarVisible(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarVisible(false);
  }, []);

  // Memoized layout configuration
  const layoutConfig = useMemo(() => ({
    showCompactView: !isChatExpanded,
    showExpandedView: isChatExpanded,
    showBottomCards: !isChatExpanded,
    sidebarVariant: isMobile ? 'overlay' : 'sidebar' as const,
    chatInputPosition: isChatExpanded ? 'expanded' : 'bottom' as const
  }), [isChatExpanded, isMobile]);

  return {
    // State
    isChatExpanded,
    sidebarVisible,
    layoutConfig,
    
    // Actions
    expandChat,
    collapseChat,
    toggleSidebar,
    closeSidebar,
    
    // Utilities
    isMobile
  };
}