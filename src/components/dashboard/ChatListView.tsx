import React from "react";
import SearchBar from "@/components/SearchBar";
import ProducerChatCard from "@/components/ProducerChatCard";
import { SquareProducerCard } from "./SquareProducerCard";
import ConversationListSkeleton from "@/components/skeletons/ConversationListSkeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot } from "lucide-react";
import { ProducerThread } from "@/hooks/useDashboardState";
import { ChatDensitySelector } from "./ChatDensitySelector";
import { useChatDensity } from "@/hooks/useChatDensity";

interface ChatListViewProps {
  chatFilter: "Produtor" | "Agenda" | "IA" | "Campo";
  onChatFilterChange: (filter: "Produtor" | "Agenda" | "IA" | "Campo") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  threads: ProducerThread[];
  loading: boolean;
  onChatSelect: (chat: ProducerThread) => void;
  onTogglePin: (chatId: string) => void;
  onStartAIChat: () => void;
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
  onStartAIChat,
}: ChatListViewProps) {
  const { density } = useChatDensity();
  
  // Separate pinned and unpinned threads
  const pinnedThreads = threads.filter(thread => thread.isPinned);
  const unpinnedThreads = threads.filter(thread => !thread.isPinned);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Conversas</h1>
            <ChatDensitySelector />
          </div>
          
          {/* Search */}
          <SearchBar 
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Buscar conversas..."
            className="mb-4"
          />
          
          {/* Filter Tabs */}
          <Tabs value={chatFilter} onValueChange={onChatFilterChange}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="Produtor">Produtor</TabsTrigger>
              <TabsTrigger value="Agenda">Agenda</TabsTrigger>
              <TabsTrigger value="IA">IA</TabsTrigger>
              <TabsTrigger value="Campo">Campo</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* AI Chat Button - shown only on IA tab */}
      {chatFilter === "IA" && (
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
          <Button 
            onClick={onStartAIChat}
            className="w-full bg-gradient-to-r from-primary to-primary-variant hover:from-primary-variant hover:to-primary transition-all duration-300"
            size="lg"
          >
            <Bot className="mr-2 h-5 w-5" />
            Conversar com I.A Ludmila
          </Button>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-4">
            <ConversationListSkeleton count={6} />
          </div>
        ) : threads.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Nenhuma conversa encontrada
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Tente ajustar sua busca" : "Suas conversas aparecerão aqui"}
              </p>
            </div>
          </div>
        ) : chatFilter === "Produtor" ? (
          <div className="p-4">
            {/* Pinned Conversations */}
            {pinnedThreads.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">
                  📌 Fixadas ({pinnedThreads.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {pinnedThreads.map((thread) => (
                    <SquareProducerCard
                      key={thread.id}
                      chat={thread}
                      onClick={onChatSelect}
                      onTogglePin={onTogglePin}
                      density={density}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Conversations */}
            {unpinnedThreads.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">
                  💬 Conversas ({unpinnedThreads.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {unpinnedThreads.map((thread) => (
                    <SquareProducerCard
                      key={thread.id}
                      chat={thread}
                      onClick={onChatSelect}
                      onTogglePin={onTogglePin}
                      density={density}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {threads.map((thread) => (
              <ProducerChatCard
                key={thread.id}
                chat={{
                  ...thread,
                  timestamp: thread.timestamp.toISOString()
                }}
                onClick={() => onChatSelect(thread)}
                onTogglePin={onTogglePin}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}