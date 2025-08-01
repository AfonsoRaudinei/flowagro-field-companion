import React, { useState } from 'react';
import { 
  Send, 
  Paperclip, 
  Camera, 
  Mic, 
  Bot, 
  User, 
  MapPin,
  Settings,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { NavigationHeader } from '@/components/ui/navigation';
import { BottomTabs } from '@/components/ui/navigation';

interface ChatTechnicalProps {
  onBack: () => void;
  onNavigateToMap: () => void;
  onNavigateToSettings: () => void;
}

const ChatTechnical: React.FC<ChatTechnicalProps> = ({ 
  onBack, 
  onNavigateToMap, 
  onNavigateToSettings 
}) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [message, setMessage] = useState('');

  const tabs = [
    { id: 'map', label: 'Mapa', icon: MapPin },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'settings', label: 'Config', icon: Settings }
  ];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'map') {
      onNavigateToMap();
    } else if (tab === 'settings') {
      onNavigateToSettings();
    }
  };

  // Mock conversation data
  const conversations = [
    {
      id: '1',
      type: 'assistant',
      message: 'Olá! Sou o assistente técnico do FlowAgro. Como posso ajudar com sua propriedade hoje?',
      timestamp: '10:30',
      avatar: null
    },
    {
      id: '2',
      type: 'user',
      message: 'Estou vendo algumas manchas amarelas na minha plantação de soja. O que pode ser?',
      timestamp: '10:32',
      avatar: null
    },
    {
      id: '3',
      type: 'assistant',
      message: 'Manchas amarelas podem indicar deficiência nutricional ou problemas fitossanitários. Você pode enviar uma foto da área afetada para uma análise mais precisa?',
      timestamp: '10:33',
      avatar: null
    },
    {
      id: '4',
      type: 'user',
      message: 'Claro! Vou fotografar agora.',
      timestamp: '10:35',
      avatar: null
    }
  ];

  const recentChats = [
    { title: 'Análise de solo - Setor A', lastMessage: 'Resultados prontos', time: 'Ontem' },
    { title: 'Controle de pragas', lastMessage: 'Recomendações aplicadas', time: '2 dias' },
    { title: 'Irrigação otimizada', lastMessage: 'Sistema configurado', time: '1 semana' }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavigationHeader
        title="Chat Técnico"
        onBack={onBack}
        showBackButton={true}
        rightActions={
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Bot className="h-5 w-5" />
          </Button>
        }
      />

      {/* Chat List / Conversation View */}
      <div className="flex-1 flex flex-col pb-20">
        {/* Recent Conversations */}
        <div className="border-b border-border bg-card">
          <div className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Conversas Recentes</h3>
            <div className="space-y-2">
              {recentChats.map((chat, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50 hover:bg-accent cursor-pointer transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{chat.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {chat.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Conversation */}
        <div className="flex-1 flex flex-col">
          {/* Conversation Header */}
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">Assistente FlowAgro</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {conversations.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] ${
                    msg.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border'
                  } rounded-lg p-3 shadow-ios-sm`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    msg.type === 'user' 
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground'
                  }`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-lg p-3 shadow-ios-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1 relative">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua pergunta..."
                  className="pr-12 h-12"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-10 w-10 p-0"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                size="sm"
                className="h-12 w-12 p-0 bg-gradient-primary shadow-ios-button"
                disabled={!message.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                Análise de solo
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                Controle de pragas
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                Irrigação
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <BottomTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={tabs}
      />
    </div>
  );
};

export default ChatTechnical;