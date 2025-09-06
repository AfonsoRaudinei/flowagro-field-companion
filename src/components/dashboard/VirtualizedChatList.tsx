import React, { memo, useMemo, useCallback, useRef, useEffect } from "react";
import { ProducerThread } from "@/hooks/useDashboardState";
import LazySquareProducerCard from "./LazySquareProducerCard";
import OptimizedSmartProducerCard from "./OptimizedSmartProducerCard";
import { useChatDensity } from "@/hooks/useChatDensity";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

interface VirtualizedChatListProps {
  threads: ProducerThread[];
  onChatSelect: (chat: ProducerThread) => void;
  onTogglePin: (chatId: string) => void;
  onArchive?: (chatId: string) => void;
  onMarkAsRead?: (chatId: string) => void;
  viewType?: 'square' | 'list';
  className?: string;
}

// Componente simplificado sem react-window para evitar problemas de dependência
const VirtualizedChatList = memo(function VirtualizedChatList({
  threads,
  onChatSelect,
  onTogglePin,
  onArchive,
  onMarkAsRead,
  viewType = 'list',
  className = ''
}: VirtualizedChatListProps) {
  const { density } = useChatDensity();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Observador para lazy loading da lista
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: false
  });

  // Calcular colunas baseado na densidade
  const columnsPerRow = useMemo(() => {
    if (viewType === 'list') return 1;
    return density === 'compact' ? 4 : density === 'comfortable' ? 3 : 2;
  }, [viewType, density]);

  // Não renderizar se não está visível (performance)
  if (!isVisible && threads.length > 20) {
    return (
      <div 
        ref={(el) => { elementRef.current = el as HTMLElement; }}
        className={`h-96 ${className}`}
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Carregando conversas...
        </div>
      </div>
    );
  }

  // Separar threads fixados
  const pinnedThreads = threads.filter(thread => thread.isPinned);
  const unpinnedThreads = threads.filter(thread => !thread.isPinned);

  return (
    <div 
      ref={(el) => {
        elementRef.current = el as HTMLElement;
        containerRef.current = el;
      }}
      className={`h-full overflow-auto ${className}`}
    >
      {viewType === 'list' ? (
        // Lista simples
        <div className="space-y-1 px-base py-sm">
          {threads.map((thread, index) => {
            const priority = index < 10 ? 'high' : index < 30 ? 'normal' : 'low';
            return (
              <div 
                key={thread.id} 
                className="animate-slide-up" 
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <OptimizedSmartProducerCard 
                  chat={thread} 
                  onClick={onChatSelect} 
                  onTogglePin={onTogglePin} 
                  onArchive={onArchive} 
                  onMarkAsRead={onMarkAsRead} 
                />
              </div>
            );
          })}
        </div>
      ) : (
        // Grid view otimizado
        <div className="p-base space-y-lg">
          {/* Pinned Conversations */}
          {pinnedThreads.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-md px-sm">
                📌 Fixadas ({pinnedThreads.length})
              </h3>
              <div 
                className="grid gap-lg transition-all duration-300" 
                style={{
                  gridTemplateColumns: `repeat(auto-fill, minmax(160px, 1fr))`,
                  gridAutoRows: 'auto',
                  alignItems: 'start'
                }}
              >
                {pinnedThreads.map((thread, index) => {
                  const priority = index < 10 ? 'high' : 'normal';
                  return (
                    <div 
                      key={thread.id} 
                      className="animate-spring" 
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <LazySquareProducerCard 
                        chat={thread} 
                        onClick={onChatSelect}
                        priority={priority}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Regular Conversations */}
          {unpinnedThreads.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-md px-sm">
                💬 Conversas ({unpinnedThreads.length})
              </h3>
              <div 
                className="grid gap-lg transition-all duration-300" 
                style={{
                  gridTemplateColumns: `repeat(auto-fill, minmax(160px, 1fr))`,
                  gridAutoRows: 'auto',
                  alignItems: 'start'
                }}
              >
                {unpinnedThreads.map((thread, index) => {
                  const absoluteIndex = pinnedThreads.length + index;
                  const priority = absoluteIndex < 10 ? 'high' : absoluteIndex < 30 ? 'normal' : 'low';
                  return (
                    <div 
                      key={thread.id} 
                      className="animate-spring" 
                      style={{ animationDelay: `${absoluteIndex * 100}ms` }}
                    >
                      <LazySquareProducerCard 
                        chat={thread} 
                        onClick={onChatSelect}
                        priority={priority}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default VirtualizedChatList;