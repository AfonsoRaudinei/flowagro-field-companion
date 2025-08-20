import React, { useState } from "react";
import TechnicalMapPanel from "@/components/map/TechnicalMapPanel";
import { ChatListView } from "@/components/dashboard/ChatListView";
import { ConversationView } from "@/components/dashboard/ConversationView";
import TechnicalChatView from "@/components/dashboard/TechnicalChatView";
import { useDashboardState } from "@/hooks/useDashboardState";
import { useSearchParams } from "react-router-dom";

export default function Dashboard() {
  const [searchParams] = useSearchParams();
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
    handleStartAIChat,
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

  // Check for map tab
  const showMap = searchParams.get('tab') === 'map';
  if (showMap) {
    return <TechnicalMapPanel />;
  }

  // Check for AI mode
  const showAI = searchParams.get('ai') === 'true';
  if (showAI) {
    return <TechnicalChatView />;
  }

  return (
    <div className="h-screen bg-background">
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
          onStartAIChat={handleStartAIChat}
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
  );
}