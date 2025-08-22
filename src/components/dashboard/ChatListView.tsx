import React, { useState } from "react";
import { DebouncedSearchBar } from "@/components/SearchBar/DebouncedSearchBar";
import { SquareProducerCard } from "./SquareProducerCard";
import OptimizedSmartProducerCard from "./OptimizedSmartProducerCard";
import ConversationListSkeleton from "@/components/skeletons/ConversationListSkeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TechnicalChatView from "./TechnicalChatView";
import { EmptyStateView } from "./EmptyStateView";
import { ProducerThread } from "@/hooks/useDashboardState";
import { useChatDensity } from "@/hooks/useChatDensity";
import { IOSHeader } from "@/components/ui/ios-header";
import ChatErrorBoundary from "@/components/ErrorBoundary/ChatErrorBoundary";
import { DebugPanel } from "@/components/Debug/DebugPanel";
import { logger } from "@/lib/logger";
import { Users, Calendar, Bot, Wheat } from "lucide-react";

interface ChatListViewProps {
  chatFilter: "Produtor" | "Agenda" | "IA" | "Campo";
  onChatFilterChange: (filter: "Produtor" | "Agenda" | "IA" | "Campo") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  threads: ProducerThread[];
  loading: boolean;
  onChatSelect: (chat: ProducerThread) => void;
  onTogglePin: (chatId: string) => void;
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
  onShowTechnicalChat,
  onBackFromTechnicalChat
}: ChatListViewProps) {
  const { density } = useChatDensity();
  const [showDebug, setShowDebug] = useState(false);

  // Separate pinned and unpinned threads
  const pinnedThreads = threads.filter(thread => thread.isPinned);
  const unpinnedThreads = threads.filter(thread => !thread.isPinned);
  
  // Log user interactions for monitoring
  React.useEffect(() => {
    logger.userAction('chat_list_view', 'dashboard', {
      threadsCount: threads.length,
      pinnedCount: pinnedThreads.length,
      filter: chatFilter
    });
  }, [threads.length, pinnedThreads.length, chatFilter]);
  
  return (
    <ChatErrorBoundary>
      <div className="flex flex-col h-screen bg-background">
        {/* iOS-style Header */}
        <IOSHeader
          title="FlowAgro"
          showBackButton={false}
          className="border-b-0"
        />

        {/* Compact Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Search and Filters - More compact */}
          <div className="px-base py-md bg-card/50 backdrop-blur-sm border-b border-border/50">
            {/* Search with debounce */}
            <DebouncedSearchBar 
              value={searchQuery} 
              onChange={onSearchChange} 
              placeholder="Buscar conversas..." 
              className="mb-md" 
            />
            
            {/* Filter Tabs - iOS style with icons */}
            <Tabs value={chatFilter} onValueChange={onChatFilterChange}>
              <TabsList className="grid w-full grid-cols-4 h-10 p-1 bg-muted/50">
                <TabsTrigger 
                  value="Produtor" 
                  className="flex items-center justify-center gap-1 text-ios-sm py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
                >
                  <Users className="h-4 w-4" />
                  {chatFilter === "Produtor" && <span>Produtor</span>}
                </TabsTrigger>
                <TabsTrigger 
                  value="Agenda" 
                  className="flex items-center justify-center gap-1 text-ios-sm py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
                >
                  <Calendar className="h-4 w-4" />
                  {chatFilter === "Agenda" && <span>Agenda</span>}
                </TabsTrigger>
                <TabsTrigger 
                  value="IA" 
                  className="flex items-center justify-center gap-1 text-ios-sm py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
                >
                  <Bot className="h-4 w-4" />
                  {chatFilter === "IA" && <span>IA</span>}
                </TabsTrigger>
                <TabsTrigger 
                  value="Campo" 
                  className="flex items-center justify-center gap-1 text-ios-sm py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
                >
                  <Wheat className="h-4 w-4" />
                  {chatFilter === "Campo" && <span>Campo</span>}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

        {/* Chat List - Optimized spacing */}
        <div className="flex-1 overflow-auto pb-20"> {/* Account for bottom nav */}
          {/* Technical Chat - shown when IA tab is active */}
          {chatFilter === "IA" ? (
            <TechnicalChatView onBack={onBackFromTechnicalChat} />
          ) : /* Empty states for Agenda and Campo */
          chatFilter === "Agenda" || chatFilter === "Campo" ? (
            <EmptyStateView type={chatFilter} />
          ) : /* Loading state */
          loading ? (
            <div className="p-base">
              <ConversationListSkeleton count={6} />
            </div>
          ) : /* No conversations found */
          threads.length === 0 ? (
            <EmptyStateView type="Produtor" />
          ) : /* Produtor view - Square cards */
          chatFilter === "Produtor" ? (
            <div className="p-base space-y-lg">
              {/* Pinned Conversations */}
              {pinnedThreads.length > 0 && (
                <div>
                  <h3 className="text-ios-sm font-semibold text-muted-foreground mb-md px-sm">
                    📌 Fixadas ({pinnedThreads.length})
                  </h3>
                  <div 
                    className="grid gap-md" 
                    style={{
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gridAutoRows: 'min-content'
                    }}
                  >
                    {pinnedThreads.map((thread, index) => (
                      <div 
                        key={thread.id} 
                        className="animate-spring" 
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <SquareProducerCard chat={thread} onClick={onChatSelect} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Conversations */}
              {unpinnedThreads.length > 0 && (
                <div>
                  <h3 className="text-ios-sm font-semibold text-muted-foreground mb-md px-sm">
                    💬 Conversas ({unpinnedThreads.length})
                  </h3>
                  <div 
                    className="grid gap-md" 
                    style={{
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gridAutoRows: 'min-content'
                    }}
                  >
                    {unpinnedThreads.map((thread, index) => (
                      <div 
                        key={thread.id} 
                        className="animate-spring" 
                        style={{ animationDelay: `${(pinnedThreads.length + index) * 100}ms` }}
                      >
                        <SquareProducerCard chat={thread} onClick={onChatSelect} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            ) : (
              <div className="space-y-1 px-base py-sm">
                {threads.map((thread, index) => (
                  <div 
                    key={thread.id} 
                    className="animate-slide-up" 
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <OptimizedSmartProducerCard 
                      chat={thread} 
                      onClick={onChatSelect} 
                      onTogglePin={onTogglePin} 
                      onArchive={(id) => {
                        console.log('Archive:', id);
                      }} 
                      onMarkAsRead={(id) => {
                        console.log('Mark as read:', id);
                      }} 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Debug Panel - Only in development */}
      {import.meta.env.DEV && (
        <DebugPanel isVisible={showDebug} onToggle={() => setShowDebug(!showDebug)} />
      )}
    </ChatErrorBoundary>
  );
}