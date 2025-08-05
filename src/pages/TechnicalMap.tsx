import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { ArrowLeft, User, Calendar, Bot, Satellite, MessageCircle, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Types for conversation management
interface Conversation {
  id: string;
  type: 'produtor' | 'agenda' | 'ia' | 'campo';
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

const TechnicalMap: React.FC = () => {
  const navigate = useNavigate();
  const { userData, isConsultor } = useUser();
  
  const [selectedSegment, setSelectedSegment] = useState<'produtor' | 'agenda' | 'ia' | 'campo'>('produtor');

  // Mock conversation data
  const conversations: Conversation[] = [
    {
      id: '1',
      type: 'produtor',
      name: 'João Silva',
      avatar: 'JS',
      lastMessage: 'Como está o desenvolvimento da soja?',
      timestamp: '10:30',
      unreadCount: 2
    },
    {
      id: '2',
      type: 'produtor',
      name: 'Maria Santos',
      avatar: 'MS',
      lastMessage: 'Preciso de orientação sobre irrigação',
      timestamp: '09:15',
      unreadCount: 0
    },
    {
      id: '3',
      type: 'agenda',
      name: 'Visita Técnica',
      avatar: '📅',
      lastMessage: 'Agendado para amanhã às 14h',
      timestamp: '08:45',
      unreadCount: 1
    },
    {
      id: '4',
      type: 'ia',
      name: 'FlowAgro IA',
      avatar: '🤖',
      lastMessage: 'Análise da imagem concluída',
      timestamp: 'Ontem',
      unreadCount: 0
    },
    {
      id: '5',
      type: 'campo',
      name: 'Talhão 03 - Soja',
      avatar: '🛰️',
      lastMessage: 'Dados de campo atualizados',
      timestamp: 'Ontem',
      unreadCount: 3
    }
  ];

  // Filter conversations based on selected segment
  const filteredConversations = conversations.filter(conv => conv.type === selectedSegment);

  const getSegmentLabel = (segment: string) => {
    switch (segment) {
      case 'produtor': return 'Produtor';
      case 'agenda': return 'Agenda';
      case 'ia': return 'IA';
      case 'campo': return 'Campo ao Vivo';
      default: return segment;
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    // Navigate to individual conversation
    console.log('Opening conversation:', conversation.name);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-background min-h-screen flex flex-col">
      {/* Header with back button */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          size="sm"
          className="p-0 h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Conversas</h1>
        <div className="w-8" /> {/* Spacer for center alignment */}
      </div>

      {/* Segmented Control */}
      <div className="p-4 border-b border-border bg-card/50">
        <ToggleGroup 
          type="single" 
          value={selectedSegment} 
          onValueChange={(value) => value && setSelectedSegment(value as any)}
          className="grid grid-cols-4 gap-1 bg-muted p-1 rounded-lg"
        >
          <ToggleGroupItem 
            value="produtor" 
            className="flex flex-col items-center gap-1 py-2 px-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md text-xs"
          >
            <User className="h-4 w-4" />
            Produtor
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="agenda" 
            className="flex flex-col items-center gap-1 py-2 px-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md text-xs"
          >
            <Calendar className="h-4 w-4" />
            Agenda
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="ia" 
            className="flex flex-col items-center gap-1 py-2 px-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md text-xs"
          >
            <Bot className="h-4 w-4" />
            IA
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="campo" 
            className="flex flex-col items-center gap-1 py-2 px-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md text-xs"
          >
            <Satellite className="h-4 w-4" />
            Campo
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mb-2" />
            <p className="text-sm">Nenhuma conversa encontrada</p>
            <p className="text-xs">em {getSegmentLabel(selectedSegment)}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationClick(conversation)}
                className="flex items-center gap-3 p-4 hover:bg-accent/50 cursor-pointer transition-colors"
              >
                {/* Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conversation.avatar?.startsWith('http') ? conversation.avatar : undefined} />
                  <AvatarFallback className="text-sm font-medium">
                    {conversation.avatar}
                  </AvatarFallback>
                </Avatar>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-foreground truncate">
                      {conversation.name}
                    </h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {conversation.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.lastMessage}
                  </p>
                </div>

                {/* Unread Badge */}
                {conversation.unreadCount > 0 && (
                  <Badge 
                    variant="default" 
                    className="ml-2 min-w-[20px] h-5 rounded-full text-xs flex items-center justify-center"
                  >
                    {conversation.unreadCount}
                  </Badge>
                )}

                {/* More Options */}
                <Button variant="ghost" size="sm" className="p-1 h-6 w-6 opacity-60">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Tab Bar (placeholder - would be implemented as a shared component) */}
      <div className="flex items-center justify-around p-4 border-t border-border bg-card/50">
        <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 p-2">
          <Satellite className="h-4 w-4" />
          <span className="text-xs">Mapa</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 p-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="text-xs text-primary">Chat</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 p-2">
          <User className="h-4 w-4" />
          <span className="text-xs">Config</span>
        </Button>
      </div>
    </div>
  );
};

export default TechnicalMap;