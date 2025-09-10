import React, { useState, useRef, useCallback } from "react";
// TechnicalMapPanel moved to standalone route
import { ChatListView } from "@/components/dashboard/ChatListView";
import { ConversationView } from "@/components/dashboard/ConversationView";
import TechnicalChatView from "@/components/dashboard/TechnicalChatView";
import { DashboardQuickCards } from "@/components/dashboard/DashboardQuickCards";
import { useDashboardState } from "@/hooks/useDashboardState";
import { useDashboardKeyboards } from "@/hooks/useDashboardKeyboards";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [newMessage, setNewMessage] = useState("");
  
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
    loadingProducers,
    loadingConversations,
    sendingMessage,
    handleChatSelect,
    handleBackToList,
    handleShowTechnicalChat,
    handleBackFromTechnicalChat,
    handleSmartBack,
    handleTogglePin,
    sendMessage,
    sendAIMessage,
    navigationHistory
  } = useDashboardState();

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
    onBackToList: handleBackToList,
    onSmartBack: handleSmartBack,
    onSearch: handleSearchFocus,
    onToggleFilter: handleToggleFilter
  });


  // Send message function  
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

  return (
    <div className="h-screen bg-background relative flex flex-col">
      {/* Quick Access Cards - sempre visíveis no topo */}
      <div className={cn(
        "flex-shrink-0 transition-all duration-300 ease-out",
        isTransitioning && "opacity-75"
      )}>
        <DashboardQuickCards 
          onChatFilterChange={setChatFilter}
          currentFilter={chatFilter}
        />
      </div>
      
      {/* Chat Content - ocupa o resto da tela com transições suaves */}
      <div className={cn(
        "flex-1 overflow-hidden transition-all duration-300 ease-out transform-gpu",
        isTransitioning && "scale-[0.99] opacity-90"
      )}>
        {viewMode === "list" ? (
          <ChatListView 
            chatFilter={chatFilter}
            onChatFilterChange={setChatFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            threads={producerThreads}
            loading={loadingConversations || loadingProducers}
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
            onBackToList={handleBackToList}
            sendingMessage={sendingMessage}
          />
        ) : null}
      </div>

      {/* Keyboard Shortcuts Help - subtle indicator */}
      {navigationHistory.length > 0 && (
        <div className="absolute bottom-4 right-4 opacity-30 hover:opacity-80 transition-opacity">
          <div className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 border border-border/50">
            {shortcuts[0].key} {shortcuts[0].description}
          </div>
        </div>
      )}
    </div>
  );
}