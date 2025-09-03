import React, { useState } from "react";
// TechnicalMapPanel moved to standalone route
import { ChatListView } from "@/components/dashboard/ChatListView";
import { ConversationView } from "@/components/dashboard/ConversationView";
import TechnicalChatView from "@/components/dashboard/TechnicalChatView";
import { useDashboardState } from "@/hooks/useDashboardState";
import IOSNavigation from "@/components/ui/ios-navigation";

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

  // Get total unread count for navigation
  const totalUnreadCount = producerThreads.reduce((total, thread) => total + (thread.unreadCount || 0), 0);

  return (
    <>
      <div className="h-screen bg-background relative">
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

      {/* iOS-style Bottom Navigation */}
      <IOSNavigation unreadCount={totalUnreadCount} />
    </>
  );
}