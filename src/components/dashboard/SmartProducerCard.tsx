import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pin, Camera, Mic, Check, CheckCheck, Archive, Heart, MoreHorizontal } from "lucide-react";
import { ProducerThread } from "@/hooks/useDashboardState";
import { SwipeActions } from "./SwipeActions";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface SmartProducerCardProps {
  chat: ProducerThread;
  onClick: (chat: ProducerThread) => void;
  onTogglePin?: (chatId: string) => void;
  onArchive?: (chatId: string) => void;
  onMarkAsRead?: (chatId: string) => void;
}

export function SmartProducerCard({ 
  chat, 
  onClick, 
  onTogglePin,
  onArchive,
  onMarkAsRead
}: SmartProducerCardProps) {
  const { toast } = useToast();

  const handleArchive = () => {
    onArchive?.(chat.id);
    toast({
      title: "Conversa arquivada",
      description: `${chat.name} foi arquivado`,
    });
  };

  const handleMarkAsRead = () => {
    onMarkAsRead?.(chat.id);
    toast({
      title: "Marcado como lido",
      description: `Conversa com ${chat.name} marcada como lida`,
    });
  };

  const handleToggleFavorite = () => {
    onTogglePin?.(chat.id);
    toast({
      title: chat.isPinned ? "Removido dos favoritos" : "Adicionado aos favoritos",
      description: chat.isPinned ? "Conversa despinada" : "Conversa fixada no topo",
    });
  };

  const leftActions = [
    {
      id: 'read',
      label: 'Marcar como lida',
      icon: <Check className="h-5 w-5" />,
      color: '#10B981', // green-500
      action: handleMarkAsRead
    }
  ];

  const rightActions = [
    {
      id: 'favorite',
      label: chat.isPinned ? 'Desfavoritar' : 'Favoritar',
      icon: <Heart className={`h-5 w-5 ${chat.isPinned ? 'fill-current' : ''}`} />,
      color: '#EF4444', // red-500
      action: handleToggleFavorite
    },
    {
      id: 'archive',
      label: 'Arquivar',
      icon: <Archive className="h-5 w-5" />,
      color: '#6B7280', // gray-500
      action: handleArchive
    }
  ];

  const getMessageStatusIcon = () => {
    if (chat.lastMessage.includes('🎙️')) return <Mic className="h-3 w-3 text-primary/60" />;
    if (chat.lastMessage.includes('📷')) return <Camera className="h-3 w-3 text-primary/60" />;
    return null;
  };

  const getMessagePreview = () => {
    let preview = chat.lastMessage;
    
    // Remove media indicators for cleaner preview
    preview = preview.replace(/🎙️|📷|📄/g, '').trim();
    
    // Add media type prefix
    if (chat.hasVoice) preview = "🎙️ Mensagem de voz";
    else if (chat.hasMedia) preview = "📷 Foto";
    else if (chat.lastMessage.includes('📄')) preview = "📄 Documento";
    
    return preview;
  };

  return (
    <SwipeActions
      leftActions={leftActions}
      rightActions={rightActions}
    >
      <Card 
        className={`
          p-4 cursor-pointer transition-all duration-300 ease-out
          hover:shadow-md hover:scale-[1.01]
          ${chat.unreadCount > 0 ? 'ring-1 ring-primary/20 bg-gradient-to-r from-primary/5 to-card' : 'bg-card'}
          ${chat.isPinned ? 'ring-1 ring-accent/30 bg-gradient-to-r from-accent/5 to-card' : ''}
          border-0 relative overflow-hidden
        `}
        onClick={() => onClick(chat)}
      >
        <div className="flex items-start gap-3">
          {/* Avatar with status */}
          <div className="relative flex-shrink-0">
            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
              <AvatarImage src={chat.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {chat.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Online status */}
            <div className={`
              absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background
              ${chat.isOnline ? 'bg-green-500' : 'bg-muted-foreground'}
            `} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              {/* Name and Farm */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate">
                    {chat.name}
                  </h3>
                  {chat.isPinned && (
                    <Pin className="h-3 w-3 text-accent fill-accent/20" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {chat.farmName} • {chat.location}
                </p>
              </div>

              {/* Timestamp and unread */}
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(chat.timestamp, { 
                    addSuffix: false, 
                    locale: ptBR 
                  })}
                </span>
                {chat.unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                  </Badge>
                )}
              </div>
            </div>

            {/* Message preview */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getMessageStatusIcon()}
                <p className="text-sm text-muted-foreground/80 truncate">
                  {getMessagePreview()}
                </p>
              </div>
              
              {/* Message status indicators */}
              <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                {/* Message delivery status */}
                <CheckCheck className="h-3 w-3 text-primary/60" />
                
                {/* More options */}
                <MoreHorizontal className="h-3 w-3 text-muted-foreground/40" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </SwipeActions>
  );
}