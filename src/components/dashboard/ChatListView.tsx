import React from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import UnifiedStatus from '@/components/ui/unified-status';
import ProducerChatCard from '@/components/ProducerChatCard';
import SearchBar from '@/components/SearchBar';
import { ProducerThread } from '@/hooks/useDashboardState';

interface ChatListViewProps {
  chatFilter: "Produtor" | "Agenda" | "IA" | "Campo";
  onChatFilterChange: (filter: "Produtor" | "Agenda" | "IA" | "Campo") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  threads: ProducerThread[];
  loading: boolean;
  onChatSelect: (chat: ProducerThread) => void;
  onTogglePin: (threadId: string) => void;
  onStartAIChat: () => void;
}

export const ChatListView: React.FC<ChatListViewProps> = ({
  chatFilter,
  onChatFilterChange,
  searchQuery,
  onSearchChange,
  threads,
  loading,
  onChatSelect,
  onTogglePin,
  onStartAIChat
}) => {
  return (
    <div className="flex flex-col h-full bg-background animate-slide-in-left">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card shadow-ios-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground text-crisp">Dashboard</h1>
          <UnifiedStatus compact />
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b bg-card">
        <SearchBar 
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Buscar conversas..."
          className="ios-button"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b bg-card shadow-ios-sm">
        {(["Produtor", "Agenda", "IA", "Campo"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => onChatFilterChange(filter)}
            className={`ios-button flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 border-b-2 text-crisp ${
              chatFilter === filter
                ? "border-primary text-primary bg-primary/5 shadow-ios-sm"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* AI Chat Button */}
      {chatFilter === "IA" && (
        <div className="p-4 border-b bg-card">
          <Button
            onClick={onStartAIChat}
            className="ios-button w-full bg-gradient-primary hover:shadow-ios-button text-white transition-all duration-300 hover:scale-[1.02]"
          >
            <Bot className="w-4 h-4 mr-2" />
            Conversar com I.A Ludmila
          </Button>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto smooth-scroll">
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="ios-spinner w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              <span className="ml-3 text-muted-foreground text-crisp">Carregando conversas...</span>
            </div>
          ) : threads.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground text-crisp">Nenhuma conversa encontrada</div>
            </div>
          ) : (
            threads.map((thread) => (
              <div key={thread.id} className="animate-fade-in">
                <ProducerChatCard
                  chat={{
                    ...thread,
                    timestamp: thread.timestamp.toISOString()
                  }}
                  onClick={() => onChatSelect(thread)}
                  onTogglePin={onTogglePin}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};