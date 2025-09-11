import React, { memo, Suspense } from 'react';
import { cn } from '@/lib/utils';
import { ChatListView } from './ChatListView';
import { ConversationView } from './ConversationView';  
import { TechnicalChatView } from './TechnicalChatView';
import ConversationListSkeleton from '../skeletons/ConversationListSkeleton';

interface DashboardExpandedViewProps {
  // View state
  viewMode: "list" | "conversation";
  showTechnicalChat: boolean;
  
  // Data
  producerThreads: any[];
  chatMessages: any[];
  selectedChat: any;
  
  // Loading states
  loadingProducers: boolean;
  loadingConversations: boolean;
  sendingMessage: boolean;
  
  // Handlers
  onChatSelect: (chat: any) => void;
  onBackToList: () => void;
  onSendMessage: (message: string) => Promise<void>;
  onSendAIMessage: (message: string) => Promise<void>;
  onTogglePin: (threadId: string) => Promise<void>;
  onShowTechnicalChat: () => void;
  onBackFromTechnicalChat: () => void;
}

/**
 * Expanded dashboard view - shows chat interface
 * Lazy loaded for better performance
 */
export const DashboardExpandedView = memo<DashboardExpandedViewProps>(({
  viewMode,
  showTechnicalChat,
  producerThreads,
  chatMessages,
  selectedChat,
  loadingProducers,
  loadingConversations,
  sendingMessage,
  onChatSelect,
  onBackToList,
  onSendMessage,
  onSendAIMessage,
  onTogglePin,
  onShowTechnicalChat,
  onBackFromTechnicalChat
}) => {
  if (showTechnicalChat) {
    return (
      <Suspense fallback={<ConversationListSkeleton />}>
        <TechnicalChatView
          onBack={onBackFromTechnicalChat}
        />
      </Suspense>
    );
  }

  if (viewMode === "conversation" && selectedChat) {
    return (
      <Suspense fallback={<ConversationListSkeleton />}>
        <ConversationView
          selectedChat={selectedChat}
          isAIMode={false}
          chatMessages={chatMessages}
          newMessage=""
          onNewMessageChange={() => {}}
          onSendMessage={() => {
            // This needs to be adapted to match the interface
          }}
          onBackToList={onBackToList}
          sendingMessage={sendingMessage}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<ConversationListSkeleton />}>
      <ChatListView
        chatFilter="Produtor"
        onChatFilterChange={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
        threads={producerThreads}
        loading={loadingProducers || loadingConversations}
        onChatSelect={onChatSelect}
        onTogglePin={onTogglePin}
        onShowTechnicalChat={() => {}}
        onBackFromTechnicalChat={onBackToList}
      />
    </Suspense>
  );
});

DashboardExpandedView.displayName = 'DashboardExpandedView';