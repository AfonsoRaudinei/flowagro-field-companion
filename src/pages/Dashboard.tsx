import React, { useState } from "react";
// TechnicalMapPanel moved to standalone route
import { ChatListView } from "@/components/dashboard/ChatListView";
import { ConversationView } from "@/components/dashboard/ConversationView";
import TechnicalChatView from "@/components/dashboard/TechnicalChatView";
import { DashboardQuickCards } from "@/components/dashboard/DashboardQuickCards";
import { useDashboardState } from "@/hooks/useDashboardState";

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
    producerThreads,
    chatMessages,
    loadingProducers,
    loadingConversations,
    sendingMessage,
    handleChatSelect,
    handleBackToList,
    handleShowTechnicalChat,
    handleBackFromTechnicalChat,
    handleTogglePin,
    sendMessage,
    sendAIMessage
  } = useDashboardState();


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
      <div className="flex-shrink-0">
        <DashboardQuickCards 
          onChatFilterChange={setChatFilter}
          currentFilter={chatFilter}
        />
      </div>
      
      {/* Chat Content - ocupa o resto da tela */}
      <div className="flex-1 overflow-hidden">
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
    </div>
  );
}