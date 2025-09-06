import React, { memo, useMemo, useCallback, useRef, useEffect } from "react";
import { FixedSizeList as List } from "react-window";
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

interface ItemData {
  threads: ProducerThread[];
  onChatSelect: (chat: ProducerThread) => void;
  onTogglePin: (chatId: string) => void;
  onArchive?: (chatId: string) => void;
  onMarkAsRead?: (chatId: string) => void;
  viewType: 'square' | 'list';
  columnsPerRow: number;
}

// Componente para renderizar item individual
const ListItem = memo(({ index, style, data }: {
  index: number;
  style: React.CSSProperties;
  data: ItemData;
}) => {
  const { 
    threads, 
    onChatSelect, 
    onTogglePin, 
    onArchive, 
    onMarkAsRead, 
    viewType, 
    columnsPerRow 
  } = data;

  if (viewType === 'list') {
    const thread = threads[index];
    if (!thread) return null;

    // Prioridade baseada na posição (primeiros 10 são high priority)
    const priority = index < 10 ? 'high' : index < 30 ? 'normal' : 'low';

    return (
      <div style={style}>
        <div className="px-base py-1">
          <OptimizedSmartProducerCard
            chat={thread}
            onClick={onChatSelect}
            onTogglePin={onTogglePin}
            onArchive={onArchive}
            onMarkAsRead={onMarkAsRead}
          />
        </div>
      </div>
    );
  } else {
    // Para view em grid, cada "item" pode conter múltiplos cards
    const startIndex = index * columnsPerRow;
    const rowThreads = threads.slice(startIndex, startIndex + columnsPerRow);

    return (
      <div style={style}>
        <div className="flex gap-lg px-base">
          {rowThreads.map((thread, colIndex) => {
            const absoluteIndex = startIndex + colIndex;
            const priority = absoluteIndex < 10 ? 'high' : absoluteIndex < 30 ? 'normal' : 'low';
            
            return (
              <div key={thread.id} className="flex-1">
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
    );
  }
});

ListItem.displayName = 'VirtualizedListItem';

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
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Observador para lazy loading da lista
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: false
  });

  // Calcular dimensões baseado no tipo de view e densidade
  const { itemHeight, columnsPerRow, itemCount } = useMemo(() => {
    if (viewType === 'list') {
      return {
        itemHeight: 80, // Altura fixa para lista
        columnsPerRow: 1,
        itemCount: threads.length
      };
    } else {
      // Para grid view
      const cols = density === 'compact' ? 4 : density === 'comfortable' ? 3 : 2;
      const height = density === 'compact' ? 120 : density === 'comfortable' ? 150 : 180;
      
      return {
        itemHeight: height,
        columnsPerRow: cols,
        itemCount: Math.ceil(threads.length / cols)
      };
    }
  }, [viewType, density, threads.length]);

  // Data para passar para os items
  const itemData: ItemData = useMemo(() => ({
    threads,
    onChatSelect,
    onTogglePin,
    onArchive,
    onMarkAsRead,
    viewType,
    columnsPerRow
  }), [threads, onChatSelect, onTogglePin, onArchive, onMarkAsRead, viewType, columnsPerRow]);

  // Callback para scroll virtual otimizado
  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    // Implementar preload baseado na posição do scroll
    const viewportHeight = containerRef.current?.clientHeight || 0;
    const totalHeight = itemCount * itemHeight;
    const scrollPercentage = scrollOffset / (totalHeight - viewportHeight);
    
    // Preload quando próximo do final
    if (scrollPercentage > 0.8) {
      // Trigger preload de mais dados se necessário
      // onRequestMoreData?.();
    }
  }, [itemCount, itemHeight]);

  // Scroll para o topo quando os threads mudam
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(0, 'start');
    }
  }, [threads.length]);

  // Não renderizar se não está visível (performance)
  if (!isVisible && threads.length > 20) {
    return (
      <div ref={elementRef} className={`h-96 ${className}`}>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Carregando conversas...
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={(el) => {
        if (elementRef.current !== el) {
          elementRef.current = el as HTMLElement;
        }
        containerRef.current = el;
      }}
      className={`h-full ${className}`}
    >
      <List
        ref={listRef}
        height={600} // Altura padrão, será ajustada pelo CSS
        itemCount={itemCount}
        itemSize={itemHeight}
        itemData={itemData}
        onScroll={handleScroll}
        overscanCount={5} // Renderizar 5 itens extras para smoother scroll
        className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
      >
        {ListItem}
      </List>
    </div>
  );
});

export default VirtualizedChatList;