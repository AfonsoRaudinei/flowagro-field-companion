import React, { memo, useMemo, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import { SquareProducerCard } from "./SquareProducerCard";
import OptimizedSmartProducerCard from "./OptimizedSmartProducerCard";
import ConversationListSkeleton from "@/components/skeletons/ConversationListSkeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TechnicalChatView from "./TechnicalChatView";
import { ProducerThread } from "@/hooks/useDashboardState";
import { useChatDensity } from "@/hooks/useChatDensity";
import { IOSHeader } from "@/components/ui/ios-header";

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

export const OptimizedChatListView = memo(function OptimizedChatListView({
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

  // Memoize separated threads to prevent recalculation on every render
  const { pinnedThreads, unpinnedThreads } = useMemo(() => ({
    pinnedThreads: threads.filter(thread => thread.isPinned),
    unpinnedThreads: threads.filter(thread => !thread.isPinned)
  }), [threads]);

  // Memoize handlers to prevent recreation
  const handleArchive = useCallback((id: string) => {
    console.log('Archive:', id);
  }, []);

  const handleMarkAsRead = useCallback((id: string) => {
    console.log('Mark as read:', id);
  }, []);

  // Memoize grid style
  const gridStyle = useMemo(() => ({
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gridAutoRows: 'min-content'
  }), []);

  const renderPinnedThreads = useMemo(() => {
    if (pinnedThreads.length === 0) return null;

    return (
      <div>
        <h3 className="text-ios-sm font-semibold text-muted-foreground mb-md px-sm">
          📌 Fixadas ({pinnedThreads.length})
        </h3>
        <div className="grid gap-md" style={gridStyle}>
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
    );
  }, [pinnedThreads, gridStyle, onChatSelect]);

  const renderUnpinnedThreads = useMemo(() => {
    if (unpinnedThreads.length === 0) return null;

    return (
      <div>
        <h3 className="text-ios-sm font-semibold text-muted-foreground mb-md px-sm">
          💬 Conversas ({unpinnedThreads.length})
        </h3>
        <div className="grid gap-md" style={gridStyle}>
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
    );
  }, [unpinnedThreads, gridStyle, onChatSelect, pinnedThreads.length]);

  const renderSmartCardsList = useMemo(() => (
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
            onArchive={handleArchive} 
            onMarkAsRead={handleMarkAsRead} 
          />
        </div>
      ))}
    </div>
  ), [threads, onChatSelect, onTogglePin, handleArchive, handleMarkAsRead]);

  const emptyState = useMemo(() => (
    <div className="flex-1 flex items-center justify-center p-xl">
      <div className="text-center">
        <h3 className="text-ios-lg font-medium text-muted-foreground mb-sm">
          Nenhuma conversa encontrada
        </h3>
        <p className="text-ios-sm text-muted-foreground">
          {searchQuery ? "Tente ajustar sua busca" : "Suas conversas aparecerão aqui"}
        </p>
      </div>
    </div>
  ), [searchQuery]);

  const loadingState = useMemo(() => (
    <div className="p-base">
      <ConversationListSkeleton count={6} />
    </div>
  ), []);

  return (
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
          {/* Search */}
          <SearchBar 
            value={searchQuery} 
            onChange={onSearchChange} 
            placeholder="Buscar conversas..." 
            className="mb-md" 
          />
          
          {/* Filter Tabs - Compact design */}
          <Tabs value={chatFilter} onValueChange={onChatFilterChange}>
            <TabsList className="grid w-full grid-cols-4 h-8 p-1 bg-muted/50">
              <TabsTrigger value="Produtor" className="text-ios-sm py-1">Produtor</TabsTrigger>
              <TabsTrigger value="Agenda" className="text-ios-sm py-1">Agenda</TabsTrigger>
              <TabsTrigger value="IA" className="text-ios-sm py-1">IA</TabsTrigger>
              <TabsTrigger value="Campo" className="text-ios-sm py-1">Campo</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Technical Chat - shown when IA tab is active */}
        {chatFilter === "IA" && (
          <TechnicalChatView onBack={onBackFromTechnicalChat} />
        )}

        {/* Chat List - Optimized spacing */}
        <div className="flex-1 overflow-auto pb-20"> {/* Account for bottom nav */}
          {chatFilter === "IA" ? null : loading ? (
            loadingState
          ) : threads.length === 0 ? (
            emptyState
          ) : chatFilter === "Produtor" ? (
            <div className="p-base space-y-lg">
              {renderPinnedThreads}
              {renderUnpinnedThreads}
            </div>
          ) : (
            renderSmartCardsList
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.chatFilter === nextProps.chatFilter &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.loading === nextProps.loading &&
    prevProps.threads.length === nextProps.threads.length &&
    prevProps.threads.every((thread, index) => 
      thread.id === nextProps.threads[index]?.id &&
      thread.unreadCount === nextProps.threads[index]?.unreadCount &&
      thread.isPinned === nextProps.threads[index]?.isPinned
    )
  );
});

export default OptimizedChatListView;