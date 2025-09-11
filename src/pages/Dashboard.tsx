import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { FlowAgroSidebar } from '@/components/dashboard/FlowAgroSidebar';
import { DashboardCompactView } from '@/components/dashboard/DashboardCompactView';
import { DashboardExpandedView } from '@/components/dashboard/DashboardExpandedView';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardState } from '@/hooks/useDashboardState';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useDashboardMemory } from '@/hooks/useDashboardMemory';
import { useDashboardKeyboards } from '@/hooks/useDashboardKeyboards';
import { performanceMonitor } from '@/lib/unifiedPerformance';

/**
 * Enhanced Dashboard with refactored architecture
 * Separated concerns for better maintainability and performance
 */
export default function Dashboard() {
  // Local state for message input
  const [newMessage, setNewMessage] = useState('');

  // Enhanced dashboard state with performance optimizations
  const {
    chatFilter,
    setChatFilter,
    searchQuery,
    setSearchQuery,
    viewMode,
    selectedChat,
    isAIMode,
    showTechnicalChat,
    selectedConversationId,
    isTransitioning,
    producerThreads,
    chatMessages,
    loadingProducers,
    loadingConversations,
    sendingMessage,
    isLoading,
    handleChatSelect,
    handleBackToList,
    handleShowTechnicalChat,
    handleBackFromTechnicalChat,
    handleSmartBack,
    handleTogglePin,
    sendMessage,
    sendAIMessage,
    markConversationAsSeen,
    navigationHistory,
    performanceMetrics
  } = useDashboardState();

  // Layout management with memory optimization
  const {
    isChatExpanded,
    sidebarVisible,
    layoutConfig,
    expandChat,
    collapseChat,
    toggleSidebar,
    closeSidebar,
    isMobile
  } = useDashboardLayout();

  // Memory optimization for heavy dashboard operations
  const { optimizeForChatExpansion } = useDashboardMemory();

  // Enhanced keyboard shortcuts
  const { shortcuts } = useDashboardKeyboards({
    onBackToList: handleBackToList,
    onSmartBack: handleSmartBack,
    onSearch: () => {
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
    onToggleFilter: () => {
      const filters = ["Produtor", "Agenda", "IA", "Campo"] as const;
      const currentIndex = filters.indexOf(chatFilter);
      const nextIndex = (currentIndex + 1) % filters.length;
      setChatFilter(filters[nextIndex]);
    }
  });

  // Optimized message handlers
  const handleSendMessageFromInput = useCallback(async (message: string) => {
    if (!message.trim()) return;
    
    try {
      setNewMessage('');
      if (isAIMode || showTechnicalChat) {
        await sendAIMessage(message);
      } else {
        await sendMessage(message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [isAIMode, showTechnicalChat, sendMessage, sendAIMessage]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;
    
    try {
      if (isAIMode || showTechnicalChat) {
        await sendAIMessage(message);
      } else {
        await sendMessage(message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [isAIMode, showTechnicalChat, sendMessage, sendAIMessage]);

  // Chat expansion handlers with memory optimization
  const handleExpandChat = useCallback(() => {
    expandChat();
    optimizeForChatExpansion();
  }, [expandChat, optimizeForChatExpansion]);

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Fixed sidebar trigger */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border shadow-sm"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <SidebarProvider open={sidebarVisible} onOpenChange={closeSidebar}>
        <FlowAgroSidebar 
          onItemSelect={() => {}}
          isOpen={sidebarVisible} 
        />
        
        <main className="flex-1 flex flex-col min-h-0 transition-all duration-300">
          {layoutConfig.showCompactView ? (
            <DashboardCompactView
              onChatExpand={handleExpandChat}
              onSendMessage={handleSendMessageFromInput}
              onChatFilterChange={setChatFilter}
              currentFilter={chatFilter}
              sendingMessage={sendingMessage}
            />
          ) : (
            <DashboardExpandedView
              viewMode={viewMode}
              showTechnicalChat={showTechnicalChat}
              producerThreads={producerThreads}
              chatMessages={chatMessages}
              selectedChat={selectedChat}
              loadingProducers={loadingProducers}
              loadingConversations={loadingConversations}
              sendingMessage={sendingMessage}
              onChatSelect={handleChatSelect}
              onBackToList={collapseChat}
              onSendMessage={handleSendMessage}
              onSendAIMessage={sendAIMessage}
              onTogglePin={handleTogglePin}
              onShowTechnicalChat={handleShowTechnicalChat}
              onBackFromTechnicalChat={handleBackFromTechnicalChat}
            />
          )}
        </main>
      </SidebarProvider>

      {/* Performance monitoring (development only) */}
      {process.env.NODE_ENV === 'development' && performanceMetrics && (
        <div className="fixed bottom-4 right-4 bg-muted/90 backdrop-blur-sm p-2 rounded text-xs font-mono text-muted-foreground border">
          <div>Threads: {performanceMetrics.threadCount}</div>
          <div>Filtered: {performanceMetrics.filteredCount}</div>
          <div>Transitioning: {performanceMetrics.isTransitioning ? 'Yes' : 'No'}</div>
        </div>
      )}

      {/* Keyboard shortcuts hint (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-muted/90 backdrop-blur-sm p-2 rounded text-xs text-muted-foreground border">
          <div className="font-semibold mb-1">Atalhos:</div>
          {shortcuts.map((shortcut, index) => (
            <div key={index}>
              <span className="font-mono">{shortcut.key}</span>: {shortcut.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}