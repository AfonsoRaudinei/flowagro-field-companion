import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Send, 
  Camera, 
  Mic, 
  Bot, 
  User, 
  MapPin,
  Settings,
  MessageSquare,
  ChevronDown,
  Smile,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import SyncIndicator from '@/components/ui/sync-indicator';
import { useToast } from '@/hooks/use-toast';

type ChatFilter = 'agenda' | 'producer' | 'ai' | 'live-field';
type ViewMode = 'list' | 'conversation';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chatFilter, setChatFilter] = useState<ChatFilter>('producer');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Mock producer chats data
  const producerChats = [
    {
      id: 1,
      name: 'João Silva',
      avatar: '/api/placeholder/40/40',
      lastMessage: 'As análises do solo chegaram. Quando podemos revisar?',
      timestamp: '14:30',
      unreadCount: 2,
      hasMedia: true,
      hasVoice: false,
      hasEmoji: true
    },
    {
      id: 2,
      name: 'Maria Santos',
      avatar: '/api/placeholder/40/40',
      lastMessage: 'Obrigada pelas recomendações de irrigação!',
      timestamp: '12:15',
      unreadCount: 0,
      hasMedia: false,
      hasVoice: true,
      hasEmoji: false
    },
    {
      id: 3,
      name: 'Carlos Oliveira',
      avatar: '/api/placeholder/40/40',
      lastMessage: 'Precisamos discutir o controle de pragas urgente',
      timestamp: 'Ontem',
      unreadCount: 5,
      hasMedia: true,
      hasVoice: false,
      hasEmoji: false
    },
    {
      id: 4,
      name: 'Ana Costa',
      avatar: '/api/placeholder/40/40',
      lastMessage: 'Os resultados da safra estão excelentes! 📈',
      timestamp: 'Ontem',
      unreadCount: 1,
      hasMedia: false,
      hasVoice: false,
      hasEmoji: true
    }
  ];

  // Mock conversation messages
  const conversationMessages = [
    {
      id: 1,
      sender: 'producer',
      message: 'Bom dia! Estou vendo algumas manchas amarelas na plantação.',
      timestamp: '09:15',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 2,
      sender: 'consultant',
      message: 'Bom dia João! Pode me enviar algumas fotos das manchas?',
      timestamp: '09:18',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 3,
      sender: 'producer',
      message: 'Claro! Segue as fotos:',
      timestamp: '09:22',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 4,
      sender: 'consultant',
      message: 'Pelas fotos, parece ser deficiência de potássio. Vou preparar um plano de adubação.',
      timestamp: '09:30',
      avatar: '/api/placeholder/40/40'
    }
  ];

  const handleChatSelect = (chat: any) => {
    setSelectedChat(chat);
    setViewMode('conversation');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedChat(null);
  };

  const handleAiChatStart = () => {
    setSelectedChat({ 
      id: 'ai-assistant', 
      name: 'Assistente IA FlowAgro', 
      type: 'ai',
      avatar: null 
    });
    setViewMode('conversation');
  };

  const handleSendAiMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      message: message.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: 'user'
    };

    setAiMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsAiTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        message: 'Isso parece ser sintoma de deficiência de potássio. Recomendo avaliação com análise de solo.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        type: 'ai'
      };
      
      setAiMessages(prev => [...prev, aiResponse]);
      setIsAiTyping(false);
    }, 2000);
  };

  const renderChatList = () => (
    <div className="flex-1 bg-background">
      {/* Filter Section */}
      <div className="p-4 bg-card border-b border-border">
        <Select value={chatFilter} onValueChange={(value: ChatFilter) => setChatFilter(value)}>
          <SelectTrigger className="w-full h-12">
            <SelectValue placeholder="Filtrar conversas" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border shadow-ios-lg z-50">
            <SelectItem value="agenda">📅 Agenda</SelectItem>
            <SelectItem value="producer">👨‍🌾 Produtor</SelectItem>
            <SelectItem value="ai">🤖 IA</SelectItem>
            <SelectItem value="live-field">📡 Campo ao Vivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chat Cards */}
      <div className="flex-1 overflow-y-auto">
        {chatFilter === 'producer' && (
          <div className="p-2">
            {producerChats.map((chat) => (
              <Card 
                key={chat.id}
                className="mb-2 p-4 cursor-pointer hover:bg-accent/50 transition-colors shadow-ios-sm"
                onClick={() => handleChatSelect(chat)}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={chat.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {chat.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-foreground truncate">
                        {chat.name}
                      </h4>
                      <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                        <span className="text-xs text-muted-foreground">
                          {chat.timestamp}
                        </span>
                        {chat.unreadCount > 0 && (
                          <Badge className="bg-primary text-primary-foreground min-w-[20px] h-5 text-xs flex items-center justify-center">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-muted-foreground truncate flex-1">
                        {chat.lastMessage}
                      </p>
                      
                      {/* Media indicators */}
                      <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                        {chat.hasMedia && (
                          <Camera className="h-4 w-4 text-muted-foreground" />
                        )}
                        {chat.hasVoice && (
                          <Mic className="h-4 w-4 text-muted-foreground" />
                        )}
                        {chat.hasEmoji && (
                          <Smile className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {chatFilter === 'ai' && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Assistente IA FlowAgro
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tire suas dúvidas técnicas sobre cultivos, pragas, doenças e muito mais
              </p>
              <Button onClick={handleAiChatStart} className="bg-primary hover:bg-primary/90">
                <Bot className="h-4 w-4 mr-2" />
                Iniciar Conversa
              </Button>
            </div>
          </div>
        )}

        {chatFilter !== 'producer' && chatFilter !== 'ai' && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                {chatFilter === 'agenda' && 'Nenhuma conversa agendada'}
                {chatFilter === 'live-field' && 'Nenhum campo ativo'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {chatFilter === 'agenda' && 'Suas conversas agendadas aparecerão aqui'}
                {chatFilter === 'live-field' && 'Monitoramento em tempo real aparecerá aqui'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderConversation = () => {
    const isAiChat = selectedChat?.type === 'ai';
    const messages = isAiChat ? aiMessages : conversationMessages;

    return (
      <div className="flex-1 flex flex-col bg-background">
        {/* Conversation Header */}
        <div className="p-4 bg-card border-b border-border">
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleBackToList}
              variant="ghost"
              size="icon"
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <Avatar className="h-10 w-10">
              {isAiChat ? (
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              ) : (
                <>
                  <AvatarImage src={selectedChat?.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedChat?.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </>
              )}
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-foreground">
                  {selectedChat?.name}
                </h3>
                {isAiChat && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                    IA
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-xs text-muted-foreground">
                  {isAiChat ? 'Assistente Online' : 'Online'}
                </span>
              </div>
            </div>
            
            {!isAiChat && (
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && isAiChat && (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">
                Olá! Sou seu assistente técnico
              </h3>
              <p className="text-sm text-muted-foreground">
                Pergunte sobre cultivos, pragas, doenças ou qualquer dúvida técnica
              </p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                isAiChat 
                  ? (msg.sender === 'user' ? 'justify-end' : 'justify-start')
                  : (msg.sender === 'consultant' ? 'justify-end' : 'justify-start')
              }`}
            >
              <div className="flex items-end space-x-2 max-w-[80%]">
                {((isAiChat && msg.sender === 'ai') || (!isAiChat && msg.sender === 'producer')) && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {isAiChat ? (
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    ) : (
                      <>
                        <AvatarImage src={msg.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {selectedChat?.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                )}
                
                <div
                  className={`rounded-2xl px-4 py-2 shadow-ios-sm ${
                    (isAiChat && msg.sender === 'user') || (!isAiChat && msg.sender === 'consultant')
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : isAiChat && msg.sender === 'ai'
                      ? 'bg-primary/5 border border-primary/20 rounded-bl-sm'
                      : 'bg-card border border-border rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    (isAiChat && msg.sender === 'user') || (!isAiChat && msg.sender === 'consultant')
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground'
                  }`}>
                    {msg.timestamp}
                  </p>
                </div>
                
                {((isAiChat && msg.sender === 'user') || (!isAiChat && msg.sender === 'consultant')) && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-secondary/10 text-secondary text-xs">
                      EU
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))}

          {/* AI Typing Indicator */}
          {isAiTyping && (
            <div className="flex justify-start">
              <div className="flex items-end space-x-2 max-w-[80%]">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-primary/5 border border-primary/20 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">IA está respondendo...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 bg-card border-t border-border">
          <div className="flex items-end space-x-2">
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                <Camera className="h-5 w-5" />
              </Button>
              {!isAiChat && (
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                  <Smile className="h-5 w-5" />
                </Button>
              )}
            </div>
            
            <div className="flex-1 relative">
              {isAiChat ? (
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua pergunta técnica..."
                  className="min-h-[48px] max-h-32 resize-none rounded-2xl border-border focus:ring-2 focus:ring-primary pr-12"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAiMessage();
                    }
                  }}
                />
              ) : (
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite uma mensagem..."
                  className="pr-12 h-12 rounded-full border-border focus:ring-2 focus:ring-primary"
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-10 w-10 rounded-full"
              >
                <Mic className="h-5 w-5" />
              </Button>
            </div>
            
            <Button
              size="icon"
              className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-ios-button"
              disabled={!message.trim() || isAiTyping}
              onClick={isAiChat ? handleSendAiMessage : undefined}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          {viewMode === 'conversation' ? (
            <Button
              onClick={handleBackToList}
              className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border"
              variant="ghost"
              size="icon"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/technical-map')}
              className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border"
              variant="ghost"
              size="icon"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Button>
          )}
          <h1 className="text-xl font-semibold text-foreground">
            {viewMode === 'conversation' ? selectedChat?.name : 'Conversas Técnicas'}
          </h1>
        </div>
        
        {/* Sync Indicator */}
        <SyncIndicator />
      </div>

      {/* Content */}
      {viewMode === 'list' ? renderChatList() : renderConversation()}
    </div>
  );
};

export default Dashboard;