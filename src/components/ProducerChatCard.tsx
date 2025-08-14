import React from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Camera, Mic, Smile, Pin } from "lucide-react";

export type ProducerChat = {
  id: number | string;
  name: string;
  farmName: string;
  location: string; // Cidade/UF
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  hasMedia?: boolean;
  hasVoice?: boolean;
  hasEmoji?: boolean;
  pinned?: boolean;
  avatar?: string | null;
  isOnline?: boolean;
};

interface ProducerChatCardProps {
  chat: ProducerChat;
  onClick: (chat: ProducerChat) => void;
  onTogglePin?: (id: ProducerChat["id"]) => void;
}

const ProducerChatCard: React.FC<ProducerChatCardProps> = ({ chat, onClick, onTogglePin }) => {
  const initials = chat.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <Card
      className="mb-3 p-5 cursor-pointer hover:bg-accent/60 hover:shadow-md hover:scale-[1.01] transition-all duration-200 ease-out shadow-sm border-0 bg-gradient-to-r from-card to-card/95"
      onClick={() => onClick(chat)}
      role="button"
      aria-label={`Abrir chat com ${chat.name}`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar with Online Status */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-14 w-14">
            {chat.avatar ? <AvatarImage src={chat.avatar} alt={chat.name} /> : null}
            <AvatarFallback className="bg-primary/15 text-primary font-semibold text-lg">{initials}</AvatarFallback>
          </Avatar>
          {chat.isOnline && (
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-card rounded-full"></div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-foreground truncate text-lg">{chat.name}</h4>
                {chat.pinned && (
                  <Pin className="h-4 w-4 text-primary" aria-label="Fixado" />
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate font-medium">
                {chat.farmName} • {chat.location}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm text-muted-foreground font-medium">{chat.timestamp}</span>
              {chat.unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground min-w-[24px] h-6 text-sm font-bold rounded-full">
                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-muted-foreground truncate flex-1 leading-relaxed">{chat.lastMessage}</p>
            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
              {chat.hasMedia && <Camera className="h-4 w-4 text-muted-foreground" />}
              {chat.hasVoice && <Mic className="h-4 w-4 text-muted-foreground" />}
              {chat.hasEmoji && <Smile className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </div>

        {/* Pin toggle */}
        {onTogglePin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(chat.id);
            }}
            className="ml-2 h-10 w-10 inline-flex items-center justify-center rounded-lg hover:bg-accent/80 text-muted-foreground transition-colors"
            aria-label={chat.pinned ? "Desafixar" : "Fixar"}
            title={chat.pinned ? "Desafixar" : "Fixar"}
          >
            <Pin className={`h-4 w-4 ${chat.pinned ? "text-primary" : ""}`} />
          </button>
        )}
      </div>
    </Card>
  );
};

export default ProducerChatCard;