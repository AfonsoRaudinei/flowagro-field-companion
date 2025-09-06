import React, { memo } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Square, SquareCheck, SquareChevronUp, MapPin } from "lucide-react";
import { ProducerThread } from "@/hooks/useDashboardState";
import { useCardSizes, CardSize } from "@/hooks/useCardSizes";
import { useLazyImage } from "@/hooks/useOptimizedLazyLoading";
import { Skeleton } from "@/components/ui/skeleton";

interface LazySquareProducerCardProps {
  chat: ProducerThread;
  onClick: (chat: ProducerThread) => void;
  priority?: 'high' | 'normal' | 'low';
}

const LazySquareProducerCard = memo(function LazySquareProducerCard({ 
  chat, 
  onClick,
  priority = 'normal'
}: LazySquareProducerCardProps) {
  const { updateCardSize, getCardSize } = useCardSizes();
  const currentSize = getCardSize(chat.id);
  
  // Lazy loading para avatar com prioridade baseada na posição
  const { elementRef: avatarRef, imageSrc, isLoaded } = useLazyImage(
    chat.avatar || '',
    {
      priority: priority === 'high' ? 90 : priority === 'normal' ? 50 : 20,
      threshold: priority === 'high' ? 0.1 : 0.2,
      rootMargin: priority === 'high' ? '100px' : '50px'
    }
  );
  
  const getSizeClasses = (size: CardSize) => {
    switch (size) {
      case 'small':
        return { 
          card: 'h-28 min-w-[140px] max-w-[180px] w-full p-3', 
          avatar: 'h-8 w-8', 
          name: 'text-xs', 
          farm: 'text-xs',
          icon: 'h-3 w-3'
        };
      case 'medium':
        return { 
          card: 'h-36 min-w-[160px] max-w-[200px] w-full p-4', 
          avatar: 'h-12 w-12', 
          name: 'text-sm', 
          farm: 'text-xs',
          icon: 'h-4 w-4'
        };
      case 'large':
        return { 
          card: 'h-44 min-w-[180px] max-w-[220px] w-full p-5', 
          avatar: 'h-16 w-16', 
          name: 'text-base', 
          farm: 'text-sm',
          icon: 'h-5 w-5'
        };
      default:
        return { 
          card: 'h-36 min-w-[140px] w-full p-4', 
          avatar: 'h-12 w-12', 
          name: 'text-sm', 
          farm: 'text-xs',
          icon: 'h-4 w-4'
        };
    }
  };

  const sizeClasses = getSizeClasses(currentSize);

  const handleSizeChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    const sizes: CardSize[] = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(currentSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    updateCardSize(chat.id, sizes[nextIndex]);
  };

  const getSizeIcon = () => {
    switch (currentSize) {
      case 'small':
        return <Square className={sizeClasses.icon} />;
      case 'medium':
        return <SquareCheck className={sizeClasses.icon} />;
      case 'large':
        return <SquareChevronUp className={sizeClasses.icon} />;
      default:
        return <SquareCheck className={sizeClasses.icon} />;
    }
  };

  return (
    <Card 
      className={`
        ${sizeClasses.card}
        cursor-pointer transition-all duration-500 ease-out
        hover:shadow-md hover:scale-[1.02]
        ${chat.unreadCount > 0 
          ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-card border-primary/30 shadow-lg shadow-primary/20' 
          : 'bg-card border-border/50'
        }
        ${chat.isPinned ? 'ring-1 ring-accent/40' : ''}
        rounded-lg relative group will-change-transform
      `}
      onClick={() => onClick(chat)}
    >
      {/* Size control button */}
      <button
        onClick={handleSizeChange}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-md hover:bg-muted/50"
        title={`Tamanho: ${currentSize}`}
      >
        {getSizeIcon()}
      </button>

      <div className="flex flex-col items-center h-full justify-center space-y-2">
        {/* Avatar com lazy loading */}
        <div className="relative flex-shrink-0" ref={avatarRef as any}>
          <Avatar className={`${sizeClasses.avatar} border border-border shadow-sm`}>
            {isLoaded && imageSrc ? (
              <AvatarImage src={imageSrc} />
            ) : !isLoaded ? (
              <Skeleton className={`${sizeClasses.avatar} rounded-full`} />
            ) : null}
            <AvatarFallback className="bg-muted text-foreground font-medium">
              {chat.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Online status indicator */}
          <div className={`
            absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background
            ${chat.isOnline ? 'bg-green-500' : 'bg-muted-foreground'}
          `} />
        </div>

        {/* Content */}
        <div className="text-center space-y-1 w-full">
          {/* Name */}
          <h3 className={`${sizeClasses.name} font-medium text-foreground truncate`}>
            {chat.name}
          </h3>
          
          {/* Farm name */}
          <p className={`${sizeClasses.farm} text-muted-foreground truncate`}>
            {chat.farmName}
          </p>

          {/* Location */}
          {chat.location && (
            <div className="flex items-center justify-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground/60" />
              <span className={`${sizeClasses.farm} text-muted-foreground/80 truncate`}>
                {chat.location}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Memoização otimizada - só re-renderiza se propriedades críticas mudaram
  return (
    prevProps.chat.id === nextProps.chat.id &&
    prevProps.chat.unreadCount === nextProps.chat.unreadCount &&
    prevProps.chat.isPinned === nextProps.chat.isPinned &&
    prevProps.chat.isOnline === nextProps.chat.isOnline &&
    prevProps.chat.name === nextProps.chat.name &&
    prevProps.chat.farmName === nextProps.chat.farmName &&
    prevProps.chat.location === nextProps.chat.location &&
    prevProps.priority === nextProps.priority
  );
});

export default LazySquareProducerCard;