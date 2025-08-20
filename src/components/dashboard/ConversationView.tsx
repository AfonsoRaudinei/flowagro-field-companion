import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
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

export const ConversationView: React.FC<ConversationViewProps> = ({
  selectedChat,
  isAIMode,
  chatMessages,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  onBackToList,
  sendingMessage
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceRecorder = useVoiceManager();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleCamera = async () => {
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
  };

  const handleVoiceRecording = async () => {
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
  };

  const handleQuickAction = (action: string) => {
    const quickMessages = {
      weather: "Qual a previsão do tempo para os próximos dias?",
      news: "Quais são as principais notícias do agronegócio hoje?",
      finance: "Como estão os preços das commodities agrícolas?",
    };

    const message = quickMessages[action as keyof typeof quickMessages];
    if (message) {
      onNewMessageChange(message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background animate-slide-in-left">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card shadow-ios-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToList}
          className="ios-button h-8 w-8 p-0 hover:bg-secondary/80"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <Avatar className="h-10 w-10 ring-2 ring-primary/10">
          <AvatarImage src={selectedChat?.avatar} />
          <AvatarFallback className="bg-gradient-primary text-white">
            {selectedChat?.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h2 className="font-semibold text-foreground text-crisp">{selectedChat?.name}</h2>
          <p className="text-sm text-muted-foreground">{selectedChat?.farmName}</p>
        </div>

        {selectedChat?.isOnline && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 smooth-scroll">
        {isAIMode && chatMessages.length === 0 && (
          <div className="flex justify-start animate-fade-in">
            <div className="max-w-[80%] p-3 rounded-lg bg-accent text-accent-foreground shadow-ios-md">
              <p className="text-sm text-crisp">
                Olá! Sou a I.A Ludmila, sua assistente técnica agrícola. Como posso ajudar você hoje?
              </p>
              <p className="text-xs opacity-70 mt-1">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
        
        {chatMessages.map((message, index) => (
          <div
            key={message.id}
            className={`flex animate-fade-in ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg shadow-ios-sm transition-all duration-200 hover:shadow-ios-md ${
                message.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : message.sender === "ai"
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-secondary-foreground"
              } ${message.isTyping ? "animate-pulse" : ""}`}
            >
              <p className="text-sm text-crisp">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {isAIMode && (
        <div className="p-4 border-t bg-card">
          <div className="flex gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("weather")}
              className="ios-button flex-1 hover:shadow-ios-sm"
            >
              <Sun className="w-4 h-4 mr-1" />
              Clima
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("news")}
              className="ios-button flex-1 hover:shadow-ios-sm"
            >
              <Newspaper className="w-4 h-4 mr-1" />
              Notícias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("finance")}
              className="ios-button flex-1 hover:shadow-ios-sm"
            >
              <DollarSign className="w-4 h-4 mr-1" />
              Financeiro
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t bg-card shadow-ios-lg">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCamera}
            className="ios-button h-10 w-10 p-0 hover:shadow-ios-sm"
          >
            <Camera className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleVoiceRecording}
            className={`ios-button h-10 w-10 p-0 transition-all duration-200 ${
              voiceRecorder.state === 'recording' 
                ? "bg-red-50 border-red-300 text-red-600 shadow-ios-sm" 
                : "hover:shadow-ios-sm"
            }`}
          >
            {voiceRecorder.state === 'recording' ? (
              <MicOff className="h-4 w-4" />
            ) : voiceRecorder.state === 'processing' ? (
              <div className="h-4 w-4 ios-spinner border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => onNewMessageChange(e.target.value)}
              placeholder={isAIMode ? "Pergunte à I.A Ludmila..." : "Digite sua mensagem..."}
              onKeyPress={(e) => e.key === "Enter" && onSendMessage()}
              className="ios-button pr-12 focus:shadow-ios-sm transition-all duration-200"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            onClick={onSendMessage}
            disabled={!newMessage.trim() || sendingMessage}
            className="ios-button px-6 bg-gradient-primary hover:shadow-ios-button transition-all duration-200 disabled:opacity-50"
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
};