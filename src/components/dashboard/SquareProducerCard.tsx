import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pin, Camera, Mic, MapPin, Clock } from "lucide-react";
import { ProducerThread } from "@/hooks/useDashboardState";
import { ChatDensity } from "@/hooks/useChatDensity";
import { MessageStatusIndicator } from "./MessageStatusIndicator";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SquareProducerCardProps {
  chat: ProducerThread;
  onClick: (chat: ProducerThread) => void;
  onTogglePin?: (chatId: string) => void;
  density: ChatDensity;
}

export function SquareProducerCard({ 
  chat, 
  onClick, 
  onTogglePin, 
  density 
}: SquareProducerCardProps) {
  
  const getDensityClasses = () => {
    switch (density) {
      case 'compact':
        return 'h-32 w-32 p-3';
      case 'comfortable':
        return 'h-36 w-36 p-4';
      case 'spacious':
        return 'h-40 w-40 p-5';
      default:
        return 'h-36 w-36 p-4';
    }
  };

  const getAvatarSize = () => {
    switch (density) {
      case 'compact':
        return 'h-10 w-10';
      case 'comfortable':
        return 'h-12 w-12';
      case 'spacious':
        return 'h-14 w-14';
      default:
        return 'h-12 w-12';
    }
  };

  const getTextSizes = () => {
    switch (density) {
      case 'compact':
        return { name: 'text-xs', farm: 'text-xs', message: 'text-xs' };
      case 'comfortable':
        return { name: 'text-sm', farm: 'text-xs', message: 'text-xs' };
      case 'spacious':
        return { name: 'text-sm', farm: 'text-sm', message: 'text-xs' };
      default:
        return { name: 'text-sm', farm: 'text-xs', message: 'text-xs' };
    }
  };

  const textSizes = getTextSizes();
  const isUnread = chat.unreadCount > 0;

  return (
    <Card 
      className={`
        ${getDensityClasses()}
        cursor-pointer transition-all duration-300 ease-out
        hover:scale-102 hover:shadow-lg
        ${isUnread ? 'ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-card' : 'bg-gradient-to-br from-card to-muted/20'}
        ${chat.isPinned ? 'ring-2 ring-accent/30' : ''}
        border-0 relative overflow-hidden
        animate-fade-in
      `}
      onClick={() => onClick(chat)}
    >
      {/* Pin indicator */}
      {chat.isPinned && (
        <div className="absolute top-2 right-2 z-10">
          <Pin 
            className="h-3 w-3 text-accent fill-accent/20" 
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin?.(chat.id);
            }}
          />
        </div>
      )}
      
      {/* Unread count badge */}
      {isUnread && (
        <Badge 
          variant="destructive" 
          className="absolute top-1 left-1 h-5 w-5 p-0 flex items-center justify-center text-xs z-10"
        >
          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
        </Badge>
      )}

      <div className="flex flex-col items-center h-full justify-between">
        {/* Avatar with online status */}
        <div className="relative flex-shrink-0">
          <Avatar className={`${getAvatarSize()} border-2 border-background shadow-sm`}>
            <AvatarImage src={chat.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
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
        <div className="flex-1 flex flex-col items-center text-center min-h-0 w-full">
          {/* Name */}
          <h3 className={`${textSizes.name} font-semibold text-foreground truncate w-full`}>
            {chat.name}
          </h3>
          
          {/* Farm name */}
          <p className={`${textSizes.farm} text-muted-foreground truncate w-full`}>
            {chat.farmName}
          </p>

          {/* Last message preview */}
          <div className="flex-1 flex items-center justify-center w-full mt-1">
            <p className={`${textSizes.message} text-muted-foreground/80 line-clamp-2 text-center`}>
              {chat.lastMessage}
            </p>
          </div>
        </div>

        {/* Footer with media indicators and timestamp */}
        <div className="flex items-center justify-between w-full mt-2 gap-1">
          {/* Media indicators */}
          <div className="flex items-center gap-1">
            {chat.hasMedia && <Camera className="h-3 w-3 text-primary/60" />}
            {chat.hasVoice && <Mic className="h-3 w-3 text-primary/60" />}
            <MessageStatusIndicator 
              status="read" 
              size="sm"
            />
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground/60" />
            <span className="text-xs text-muted-foreground/80">
              {formatDistanceToNow(chat.timestamp, { 
                addSuffix: false, 
                locale: ptBR 
              })}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}