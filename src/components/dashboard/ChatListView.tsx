import React, { useState } from "react";
import { SquareProducerCard } from "./SquareProducerCard";
import OptimizedSmartProducerCard from "./OptimizedSmartProducerCard";
import ConversationListSkeleton from "@/components/skeletons/ConversationListSkeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TechnicalChatView from "./TechnicalChatView";
import { EmptyStateView } from "./EmptyStateView";
import { ProducerThread } from "@/hooks/useDashboardState";
import { useChatDensity } from "@/hooks/useChatDensity";
import { IOSHeader } from "@/components/ui/unified-header";
import { ChatErrorBoundary } from "@/components/errors/UnifiedErrorBoundary";
import { DebugPanel } from "@/components/Debug/DebugPanel";
import { logger } from "@/lib/logger";
import { Users, Calendar, Bot, Wheat, Bell, MessageCircle, Search } from "lucide-react";
interface ChatListViewProps {
  chatFilter: "Produtor" | "Agenda" | "IA" | "Campo";
  onChatFilterChange: (filter: "Produtor" | "Agenda" | "IA" | "Campo") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  threads: ProducerThread[];
  loading: boolean;
  onChatSelect: (chat: ProducerThread) => void;
  onTogglePin: (chatId: string) => void;
  onArchive?: (chatId: string) => void;
  onMarkAsRead?: (chatId: string) => void;
  onShowTechnicalChat: () => void;
  onBackFromTechnicalChat: () => void;
}
export function ChatListView({
  chatFilter,
  onChatFilterChange,
  searchQuery,
  onSearchChange,
  threads,
  loading,
  onChatSelect,
  onTogglePin,
  onArchive,
  onMarkAsRead,
  onShowTechnicalChat,
  onBackFromTechnicalChat
}: ChatListViewProps) {
  const {
    density
  } = useChatDensity();
  const [showDebug, setShowDebug] = useState(false);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Apply unread filter if active, then separate pinned and unpinned threads
  const filteredThreads = showOnlyUnread ? threads.filter(thread => thread.unreadCount > 0) : threads;
  const pinnedThreads = filteredThreads.filter(thread => thread.isPinned);
  const unpinnedThreads = filteredThreads.filter(thread => !thread.isPinned);

  // Count unread conversations for the toggle
  const unreadCount = threads.filter(thread => thread.unreadCount > 0).length;

  // Log user interactions for monitoring
  React.useEffect(() => {
    logger.userAction('chat_list_view', 'dashboard', {
      threadsCount: threads.length,
      pinnedCount: pinnedThreads.length,
      filter: chatFilter
    });
  }, [threads.length, pinnedThreads.length, chatFilter]);
  return <ChatErrorBoundary>
      <div className="flex flex-col h-screen bg-background">
        {/* iOS-style Header */}
        <IOSHeader title="FlowAgro" showBackButton={false} className="border-b-0" />

        {/* Compact Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Compact Info Bar */}
          

        {/* Chat List - Optimized spacing */}
        <div className="flex-1 overflow-auto pb-20"> {/* Account for bottom nav */}
          {/* Technical Chat - shown when IA tab is active */}
          {chatFilter === "IA" ? <TechnicalChatView onBack={onBackFromTechnicalChat} /> : /* Empty states for Agenda and Campo */
          chatFilter === "Agenda" || chatFilter === "Campo" ? <EmptyStateView type={chatFilter} /> : /* Loading state */
          loading ? <div className="p-base">
              <ConversationListSkeleton count={6} />
            </div> : /* No conversations found */
          filteredThreads.length === 0 ? <div className="flex flex-col items-center justify-center h-64 text-center p-base">
              {showOnlyUnread ? <>
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Nenhuma conversa não lida
                  </h3>
                  <p className="text-muted-foreground">
                    Todas as suas conversas estão em dia! 🎉
                  </p>
                </> : <EmptyStateView type="Produtor" />}
            </div> : /* Produtor view - Square cards */
          chatFilter === "Produtor" ? <div className="p-base space-y-lg">
              {/* Pinned Conversations */}
              {pinnedThreads.length > 0 && <div>
                  <h3 className="text-ios-sm font-semibold text-muted-foreground mb-md px-sm">
                    📌 Fixadas {showOnlyUnread ? 'não lidas' : ''} ({pinnedThreads.length})
                  </h3>
                  <div className="grid gap-lg transition-all duration-300" style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gridAutoRows: 'auto',
                alignItems: 'start'
              }}>
                    {pinnedThreads.map((thread, index) => <div key={thread.id} className="animate-spring" style={{
                  animationDelay: `${index * 100}ms`
                }}>
                        <SquareProducerCard chat={thread} onClick={onChatSelect} />
                      </div>)}
                  </div>
                </div>}

              {/* Regular Conversations */}
              {unpinnedThreads.length > 0 && <div>
                  <h3 className="text-ios-sm font-semibold text-muted-foreground mb-md px-sm">
                    💬 Conversas {showOnlyUnread ? 'não lidas' : ''} ({unpinnedThreads.length})
                  </h3>
                  <div className="grid gap-lg transition-all duration-300" style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gridAutoRows: 'auto',
                alignItems: 'start'
              }}>
                    {unpinnedThreads.map((thread, index) => <div key={thread.id} className="animate-spring" style={{
                  animationDelay: `${(pinnedThreads.length + index) * 100}ms`
                }}>
                        <SquareProducerCard chat={thread} onClick={onChatSelect} />
                      </div>)}
                  </div>
                </div>}
            </div> : <div className="space-y-1 px-base py-sm">
                {filteredThreads.map((thread, index) => <div key={thread.id} className="animate-slide-up" style={{
              animationDelay: `${index * 50}ms`
            }}>
                    <OptimizedSmartProducerCard chat={thread} onClick={onChatSelect} onTogglePin={onTogglePin} onArchive={onArchive} onMarkAsRead={onMarkAsRead} />
                  </div>)}
              </div>}
          </div>
        </div>
      </div>
      
      {/* Debug Panel - Only in development */}
      {import.meta.env.DEV && <DebugPanel isVisible={showDebug} onToggle={() => setShowDebug(!showDebug)} />}
    </ChatErrorBoundary>;
}