import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Camera, Mic, Bot } from 'lucide-react';

interface BaseMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'producer';
  timestamp: Date;
  type: 'text' | 'audio' | 'image';
  isTyping?: boolean;
}

interface MessageBubbleProps {
  message: BaseMessage;
  showAvatar?: boolean;
  senderName?: string;
  senderAvatar?: string;
}

const MessageBubble = memo<MessageBubbleProps>(({ 
  message, 
  showAvatar = true, 
  senderName,
  senderAvatar 
}) => {
  const isUser = message.sender === 'user';
  const isAI = message.sender === 'ai';

  const getSenderInitials = () => {
    if (isAI) return 'AI';
    if (senderName) {
      return senderName.split(' ').map(n => n[0]).join('').slice(0, 2);
    }
    return message.sender === 'user' ? 'EU' : 'P';
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const renderMessageIcon = () => {
    switch (message.type) {
      case 'audio':
        return <Mic className="h-3 w-3" />;
      case 'image':
        return <Camera className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 mb-4 animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar (only for non-user messages) */}
      {!isUser && showAvatar && (
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            {senderAvatar && <AvatarImage src={senderAvatar} />}
            <AvatarFallback className={cn(
              "text-xs font-medium",
              isAI ? "bg-primary/15 text-primary" : "bg-secondary text-secondary-foreground"
            )}>
              {isAI ? <Bot className="h-4 w-4" /> : getSenderInitials()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        "max-w-[75%] min-w-[120px]",
        isUser ? "order-first" : ""
      )}>
        {/* Sender name for non-user messages */}
        {!isUser && senderName && (
          <div className="text-xs text-muted-foreground mb-1 px-1">
            {senderName}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-sm transition-all duration-200",
            "relative group hover:shadow-md",
            isUser 
              ? "bg-primary text-primary-foreground ml-auto rounded-br-md" 
              : "bg-card border border-border rounded-bl-md",
            message.isTyping && "animate-pulse"
          )}
        >
          <div className="flex items-start gap-2">
            {renderMessageIcon() && (
              <div className={cn(
                "mt-0.5 flex-shrink-0",
                isUser ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {renderMessageIcon()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm leading-relaxed break-words",
                isUser ? "text-primary-foreground" : "text-foreground"
              )}>
                {message.isTyping ? (
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce delay-100">●</span>
                    <span className="animate-bounce delay-200">●</span>
                  </span>
                ) : (
                  message.content
                )}
              </p>
            </div>
          </div>

          {/* Timestamp */}
          <div className={cn(
            "text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isUser ? "text-primary-foreground/70 text-right" : "text-muted-foreground"
          )}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>

      {/* User avatar */}
      {isUser && showAvatar && (
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-medium">
              EU
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
export type { BaseMessage };