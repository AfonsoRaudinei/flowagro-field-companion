import React, { useState, useCallback, memo, Suspense } from "react";
// TechnicalMapPanel moved to standalone route
import { ChatListView } from "@/components/dashboard/ChatListView";
import { ConversationView } from "@/components/dashboard/ConversationView";
import TechnicalChatView from "@/components/dashboard/TechnicalChatView";
import { DashboardQuickCards } from "@/components/dashboard/DashboardQuickCards";
import { ChatInputBar } from "@/components/dashboard/ChatInputBar";
import { LoadingBoundary } from "@/components/dashboard/LoadingBoundary";
import { FlowAgroSidebar } from "@/components/dashboard/FlowAgroSidebar";
import { useDashboardState } from "@/hooks/useDashboardState";
import { useDashboardKeyboards } from "@/hooks/useDashboardKeyboards";
import { useMemoryOptimization } from "@/hooks/useMemoryOptimization";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { performanceMonitor } from "@/lib/unifiedPerformance";

/**
 * Optimized Dashboard component with performance enhancements
 * - Memoized components and callbacks
 * - Suspense boundaries for better loading UX
 * - GPU-accelerated animations
 */

export default function Dashboard() {
  const [newMessage, setNewMessage] = useState("");
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Memory optimization for large datasets
  const { registerCleanupTask, forceMemoryCheck, clearCaches } = useMemoryOptimization({
    threshold: 0.75, // Trigger cleanup at 75% memory usage
    checkInterval: 45000, // Check every 45 seconds
    onMemoryPressure: () => {
      // Clear image caches and temporary data when memory pressure is detected
      clearCaches();
    },
    enableLogging: process.env.NODE_ENV === 'development'
  });
  
  const {
    chatFilter,
    setChatFilter,
    searchQuery,
    setSearchQuery,
    viewMode,
    selectedChat,
    isAIMode,
    isTransitioning,
    producerThreads,
    chatMessages,
    isLoading,
    sendingMessage,
    handleChatSelect,
    handleBackToList,
    handleShowTechnicalChat,
    handleBackFromTechnicalChat,
    handleSmartBack,
    handleTogglePin,
    sendMessage,
    sendAIMessage,
    navigationHistory,
    performanceMetrics
  } = useDashboardState();

  // Handle expanding chat view
  const handleExpandChat = useCallback(() => {
    setIsChatExpanded(true);
  }, []);

  // Handle collapsing chat view
  const handleCollapseChat = useCallback(() => {
    setIsChatExpanded(false);
    handleBackToList();
  }, [handleBackToList]);

  // Enhanced search focus handler - can be enhanced later with ref forwarding
  const handleSearchFocus = useCallback(() => {
    // Focus search input - can be implemented with ref forwarding if needed
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    searchInput?.focus();
  }, []);

  // Cycle through filters
  const handleToggleFilter = useCallback(() => {
    const filters: Array<"Produtor" | "Agenda" | "IA" | "Campo"> = ["Produtor", "Agenda", "IA", "Campo"];
    const currentIndex = filters.indexOf(chatFilter);
    const nextIndex = (currentIndex + 1) % filters.length;
    setChatFilter(filters[nextIndex]);
  }, [chatFilter, setChatFilter]);

  // Setup keyboard shortcuts
  const { shortcuts } = useDashboardKeyboards({
    onBackToList: handleCollapseChat,
    onSmartBack: handleSmartBack,
    onSearch: handleSearchFocus,
    onToggleFilter: handleToggleFilter
  });

  // Send message function from chat input bar
  const handleSendMessageFromInput = useCallback(async (message: string) => {
    if (isAIMode) {
      await sendAIMessage(message);
    } else {
      await sendMessage(message);
    }
    // Auto-expand chat after sending message
    setIsChatExpanded(true);
  }, [isAIMode, sendMessage, sendAIMessage]);

  // Send message function for conversation view
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageToSend = newMessage;
    setNewMessage("");

    if (isAIMode) {
      await sendAIMessage(messageToSend);
    } else {
      await sendMessage(messageToSend);
    }
  };

  // Handle sidebar item selection with performance tracking
  const handleSidebarItemSelect = useCallback((item: any) => {
    performanceMonitor.measure('sidebar-item-select', () => {
      console.log('Selected:', item);
      setSidebarOpen(false);
    });
  }, []);

  // Register memory cleanup tasks
  React.useEffect(() => {
    const unregisterCleanups = [
      // Clear component state when memory pressure occurs
      registerCleanupTask(() => {
        setNewMessage("");
        // Force garbage collection of large objects
        if (producerThreads.length > 100) {
          // Trigger re-render to clear unused components
          setIsChatExpanded(prev => prev);
        }
      })
    ];

    return () => {
      unregisterCleanups.forEach(cleanup => cleanup());
    };
  }, [registerCleanupTask, producerThreads.length]);

  return (
    <>
      {/* Fixed Sidebar Trigger - Always visible at top left */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          "fixed top-4 left-4 z-[9999] w-11 h-11 rounded-xl border-0 shadow-lg backdrop-blur-md",
          "bg-white/90 hover:bg-white text-[#2D2D30] hover:text-[#2D2D30]",
          "transition-all duration-200 hover:scale-105 active:scale-95",
          "focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
        )}
      >
        <Users className="w-5 h-5" />
      </Button>

      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        {/* Backdrop overlay when sidebar is open */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-[9997] backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <FlowAgroSidebar onItemSelect={handleSidebarItemSelect} isOpen={sidebarOpen} />
        
        <div className="h-screen bg-background flex flex-col overflow-hidden w-full">
          {/* Grok-style Dashboard View */}
          {!isChatExpanded ? (
            <>
              {/* Main Content - Carousel centered */}
              <div className="flex-1 flex flex-col justify-center overflow-hidden">
                {/* Welcome Section */}
                <div className="text-center px-6 mb-8">
                  <h1 className={cn(
                    "font-secondary font-bold text-foreground",
                    "text-2xl sm:text-3xl lg:text-4xl mb-2",
                    "tracking-tight"
                  )}>
                    Olá! Como posso ajudar?
                  </h1>
                  <p className={cn(
                    "font-secondary text-muted-foreground",
                    "text-sm sm:text-base lg:text-lg",
                    "max-w-2xl mx-auto leading-relaxed"
                  )}>
                    Acesse suas ferramentas ou converse comigo sobre agricultura
                  </p>
                </div>

                {/* Carousel Cards */}
                <div className="flex-shrink-0 px-3 sm:px-4">
                  <LoadingBoundary>
                    <DashboardQuickCards 
                      onChatFilterChange={setChatFilter}
                      currentFilter={chatFilter}
                    />
                  </LoadingBoundary>
                </div>
              </div>

              {/* Fixed Chat Input Bar */}
              <ChatInputBar
                onSendMessage={handleSendMessageFromInput}
                onExpandChat={handleExpandChat}
                placeholder="Pergunte qualquer coisa sobre agricultura..."
                disabled={sendingMessage}
              />
            </>
          ) : (
            /* Expanded Chat View */
            <div className={cn(
              "flex-1 overflow-hidden transition-all duration-300 ease-out",
              "pb-safe transform-gpu will-change-transform",
              isTransitioning && "scale-[0.99] opacity-90"
            )}>
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              }>
                {viewMode === "list" ? (
                  <ChatListView 
                    chatFilter={chatFilter}
                    onChatFilterChange={setChatFilter}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    threads={producerThreads}
                    loading={isLoading}
                    onChatSelect={handleChatSelect}
                    onTogglePin={handleTogglePin}
                    onShowTechnicalChat={handleShowTechnicalChat}
                    onBackFromTechnicalChat={handleBackFromTechnicalChat}
                  />
                ) : selectedChat ? (
                  <ConversationView
                    selectedChat={selectedChat}
                    isAIMode={isAIMode}
                    chatMessages={chatMessages}
                    newMessage={newMessage}
                    onNewMessageChange={setNewMessage}
                    onSendMessage={handleSendMessage}
                    onBackToList={handleCollapseChat}
                    sendingMessage={sendingMessage}
                  />
                ) : null}
              </Suspense>
            </div>
          )}

          {/* Enhanced Performance Monitor (development only) */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <div className="fixed top-16 right-4 z-50 opacity-50 text-xs bg-background/80 backdrop-blur-sm rounded px-2 py-1 border border-border/50">
                {performanceMetrics?.filteredCount || 0}/{performanceMetrics?.threadCount || 0} threads
                {performanceMetrics?.isTransitioning && " • transitioning"}
              </div>
            </>
          )}

          {/* Keyboard Shortcuts Help - desktop only for performance */}
          {navigationHistory.length > 0 && isChatExpanded && (
            <div className="hidden lg:block absolute bottom-4 right-4 opacity-30 hover:opacity-80 transition-opacity">
              <div className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 border border-border/50">
                {shortcuts[0].key} {shortcuts[0].description}
              </div>
            </div>
          )}
        </div>
      </SidebarProvider>
    </>
  );
}