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
      className="mb-2 p-4 cursor-pointer hover:bg-accent/50 transition-colors shadow-ios-sm"
      onClick={() => onClick(chat)}
      role="button"
      aria-label={`Abrir chat com ${chat.name}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="h-12 w-12 flex-shrink-0">
          {chat.avatar ? <AvatarImage src={chat.avatar} alt={chat.name} /> : null}
          <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground truncate">{chat.name}</h4>
                {chat.pinned ? (
                  <Pin className="h-4 w-4 text-primary" aria-label="Fixado" />
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {chat.farmName} • {chat.location}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
              {chat.unreadCount > 0 ? (
                <Badge className="bg-success text-success-foreground min-w-[20px] h-5 text-xs flex items-center justify-center">
                  {chat.unreadCount}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-muted-foreground truncate flex-1">{chat.lastMessage}</p>
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              {chat.hasMedia ? <Camera className="h-4 w-4 text-muted-foreground" /> : null}
              {chat.hasVoice ? <Mic className="h-4 w-4 text-muted-foreground" /> : null}
              {chat.hasEmoji ? <Smile className="h-4 w-4 text-muted-foreground" /> : null}
            </div>
          </div>
        </div>

        {/* Pin toggle */}
        {onTogglePin ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(chat.id);
            }}
            className="ml-2 h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground"
            aria-label={chat.pinned ? "Desafixar" : "Fixar"}
            title={chat.pinned ? "Desafixar" : "Fixar"}
          >
            <Pin className={`h-4 w-4 ${chat.pinned ? "text-primary" : ""}`} />
          </button>
        ) : null}
      </div>
    </Card>
  );
};

export default ProducerChatCard;
