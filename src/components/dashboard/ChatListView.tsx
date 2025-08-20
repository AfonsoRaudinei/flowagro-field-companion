import React from "react";
import SearchBar from "@/components/SearchBar";
import ProducerChatCard from "@/components/ProducerChatCard";
import { SquareProducerCard } from "./SquareProducerCard";
import { SmartProducerCard } from "./SmartProducerCard";
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

      {/* AI Consultoria Content - shown only on IA tab */}
      {chatFilter === "IA" && (
        <div className="p-4 space-y-4">
          <div className="p-6 rounded-lg border bg-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Chat Técnico</h2>
                <p className="text-sm text-muted-foreground">
                  Converse com nossa IA especializada
                </p>
              </div>
            </div>
            <Button
              onClick={onStartAIChat}
              className="w-full bg-gradient-to-r from-primary to-primary-variant hover:from-primary-variant hover:to-primary transition-all duration-300"
            >
              <Bot className="mr-2 h-4 w-4" />
              Iniciar Chat Técnico
            </Button>
          </div>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-auto">
        {chatFilter === "IA" ? (
          // IA tab shows only consultoria content above, no chat list
          null
        ) : loading ? (
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
                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gridAutoRows: 'min-content' }}>
                  {pinnedThreads.map((thread, index) => (
                    <div
                      key={thread.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <SquareProducerCard
                        chat={thread}
                        onClick={onChatSelect}
                      />
                    </div>
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
                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gridAutoRows: 'min-content' }}>
                  {unpinnedThreads.map((thread, index) => (
                    <div
                      key={thread.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${(pinnedThreads.length + index) * 100}ms` }}
                    >
                      <SquareProducerCard
                        chat={thread}
                        onClick={onChatSelect}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {threads.map((thread, index) => (
              <div 
                key={thread.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <SmartProducerCard
                  chat={thread}
                  onClick={onChatSelect}
                  onTogglePin={onTogglePin}
                  onArchive={(id) => {
                    // Implement archive functionality
                    console.log('Archive:', id);
                  }}
                  onMarkAsRead={(id) => {
                    // Implement mark as read functionality  
                    console.log('Mark as read:', id);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}