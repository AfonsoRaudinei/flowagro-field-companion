import React, { useRef, useEffect, memo, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Send, 
  Mic, 
  MicOff, 
  Camera, 
  Paperclip, 
  Sun, 
  DollarSign, 
  Newspaper 
} from 'lucide-react';
import { ProducerThread, ChatMessage } from '@/hooks/useDashboardState';
import useVoiceManager from '@/hooks/useVoiceManager';
import { toast } from '@/hooks/use-toast';
import { ConversationHeader } from '@/components/ui/ios-header';

interface ConversationViewProps {
  selectedChat: ProducerThread;
  isAIMode: boolean;
  chatMessages: ChatMessage[];
  newMessage: string;
  onNewMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onBackToList: () => void;
  sendingMessage: boolean;
}

export const OptimizedConversationView = memo(function OptimizedConversationView({
  selectedChat,
  isAIMode,
  chatMessages,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  onBackToList,
  sendingMessage
}: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceRecorder = useVoiceManager();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, scrollToBottom]);

  const handleCamera = useCallback(async () => {
    try {
      toast({
        title: "📷 Camera",
        description: "Funcionalidade em desenvolvimento",
      });
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Falha ao capturar imagem",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleVoiceRecording = useCallback(async () => {
    if (voiceRecorder.state === 'recording') {
      const result = await voiceRecorder.stopRecording();
      if (result) {
        toast({
          title: "🎤 Gravação finalizada",
          description: "Áudio salvo com sucesso",
        });
      }
    } else if (voiceRecorder.state === 'idle') {
      await voiceRecorder.startRecording();
      toast({
        title: "🎙️ Gravação iniciada",
        description: "Gravando áudio...",
      });
    }
  }, [voiceRecorder, toast]);

  const handleQuickAction = useCallback((action: string) => {
    const quickMessages = {
      weather: "Qual a previsão do tempo para os próximos dias?",
      news: "Quais são as principais notícias do agronegócio hoje?",
      finance: "Como estão os preços das commodities agrícolas?",
    };

    const message = quickMessages[action as keyof typeof quickMessages];
    if (message) {
      onNewMessageChange(message);
    }
  }, [onNewMessageChange]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSendMessage();
    }
  }, [onSendMessage]);

  const conversationAvatar = useMemo(() => (
    <Avatar className="h-10 w-10 ring-2 ring-primary/10">
      <AvatarImage src={selectedChat?.avatar} />
      <AvatarFallback className="bg-gradient-primary text-white">
        {selectedChat?.name.charAt(0)}
      </AvatarFallback>
    </Avatar>
  ), [selectedChat?.avatar, selectedChat?.name]);

  const quickActionsButtons = useMemo(() => (
    <div className="flex gap-sm">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleQuickAction("weather")}
        className="ios-button flex-1 hover:shadow-ios-sm text-ios-sm h-8"
      >
        <Sun className="w-4 h-4 mr-xs" />
        Clima
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleQuickAction("news")}
        className="ios-button flex-1 hover:shadow-ios-sm text-ios-sm h-8"
      >
        <Newspaper className="w-4 h-4 mr-xs" />
        Notícias
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleQuickAction("finance")}
        className="ios-button flex-1 hover:shadow-ios-sm text-ios-sm h-8"
      >
        <DollarSign className="w-4 h-4 mr-xs" />
        Financeiro
      </Button>
    </div>
  ), [handleQuickAction]);

  const voiceButtonIcon = useMemo(() => {
    if (voiceRecorder.state === 'recording') {
      return <MicOff className="h-4 w-4" />;
    } else if (voiceRecorder.state === 'processing') {
      return <div className="h-4 w-4 ios-spinner border-2 border-current border-t-transparent rounded-full" />;
    }
    return <Mic className="h-4 w-4" />;
  }, [voiceRecorder.state]);

  return (
    <div className="flex flex-col h-full bg-background animate-slide-in-left">
      {/* iOS-style Header */}
      <ConversationHeader
        name={selectedChat?.name || ''}
        subtitle={selectedChat?.farmName}
        avatar={conversationAvatar}
        isOnline={selectedChat?.isOnline}
        onBack={onBackToList}
      />

      {/* Messages - More compact spacing */}
      <div className="flex-1 overflow-y-auto px-base py-md space-y-md smooth-scroll">
        {isAIMode && chatMessages.length === 0 && (
          <div className="flex justify-start animate-spring">
            <div className="max-w-[80%] px-md py-sm rounded-lg bg-accent text-accent-foreground shadow-ios-card">
              <p className="text-ios-base text-crisp">
                Olá! Sou a I.A Ludmila, sua assistente técnica agrícola. Como posso ajudar você hoje?
              </p>
              <p className="text-ios-xs opacity-70 mt-xs">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
        
        {chatMessages.map((message, index) => (
          <div
            key={message.id}
            className={`flex animate-spring ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div
              className={`max-w-[85%] px-md py-sm rounded-lg shadow-ios-sm transition-all duration-200 hover:shadow-ios-md ${
                message.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : message.sender === "ai"
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-secondary-foreground"
              } ${message.isTyping ? "animate-pulse" : ""}`}
            >
              <p className="text-ios-base text-crisp">{message.content}</p>
              <p className="text-ios-xs opacity-70 mt-xs">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions - More compact */}
      {isAIMode && (
        <div className="px-base py-sm bg-card/50 backdrop-blur-sm border-t border-border/50">
          {quickActionsButtons}
        </div>
      )}

      {/* Compact Input Area */}
      <div className="px-base py-md bg-card/95 backdrop-blur-md border-t border-border/50 shadow-ios-lg pb-20"> {/* Account for nav */}
        <div className="flex items-center gap-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCamera}
            className="ios-button h-9 w-9 p-0 hover:shadow-ios-sm"
          >
            <Camera className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleVoiceRecording}
            className={`ios-button h-9 w-9 p-0 transition-all duration-200 ${
              voiceRecorder.state === 'recording' 
                ? "bg-red-50 border-red-300 text-red-600 shadow-ios-sm" 
                : "hover:shadow-ios-sm"
            }`}
          >
            {voiceButtonIcon}
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => onNewMessageChange(e.target.value)}
              placeholder={isAIMode ? "Pergunte à I.A Ludmila..." : "Digite sua mensagem..."}
              onKeyPress={handleKeyPress}
              className="ios-button pr-10 focus:shadow-ios-sm transition-all duration-200 h-9 text-ios-base"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted/50"
            >
              <Paperclip className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <Button
            onClick={onSendMessage}
            disabled={!newMessage.trim() || sendingMessage}
            className="ios-button px-4 h-9 bg-gradient-primary hover:shadow-ios-button transition-all duration-200 disabled:opacity-50"
          >
            {sendingMessage ? (
              <div className="h-4 w-4 ios-spinner border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.selectedChat?.id === nextProps.selectedChat?.id &&
    prevProps.isAIMode === nextProps.isAIMode &&
    prevProps.newMessage === nextProps.newMessage &&
    prevProps.sendingMessage === nextProps.sendingMessage &&
    prevProps.chatMessages.length === nextProps.chatMessages.length &&
    prevProps.chatMessages.every((msg, index) => 
      msg.id === nextProps.chatMessages[index]?.id &&
      msg.content === nextProps.chatMessages[index]?.content
    )
  );
});

export default OptimizedConversationView;