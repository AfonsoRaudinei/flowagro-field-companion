import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import SyncIndicator from "@/components/ui/sync-indicator";
import ProducerChatCard from "@/components/ProducerChatCard";
import SearchBar from "@/components/SearchBar";
import TechnicalMapPanel from "@/components/map/TechnicalMapPanel";
import { CameraService } from "@/services/cameraService";
import useVoiceRecorder from "@/hooks/useVoiceRecorder";
import { useProducers } from "@/hooks/useProducers";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft,
  Send,
  Mic,
  MicOff,
  Camera,
  Paperclip,
  Sun,
  DollarSign,
  Newspaper,
  MapPin,
  Bot
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// Types for the data structures
interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'producer';
  timestamp: Date;
  type: 'text' | 'audio' | 'image';
  isTyping?: boolean;
}

interface ProducerThread {
  id: string;
  name: string;
  farmName: string;
  location: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  hasMedia: boolean;
  hasVoice: boolean;
  hasEmoji: boolean;
  isPinned: boolean;
  avatar?: string;
  isOnline: boolean;
  conversationId?: string;
}

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const [chatFilter, setChatFilter] = useState<"Produtor" | "Agenda" | "IA" | "Campo">("Produtor");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "conversation">("list");
  const [selectedChat, setSelectedChat] = useState<ProducerThread | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isAIMode, setIsAIMode] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // Use real data hooks
  const { producers, loading: loadingProducers } = useProducers();
  const { conversations, loading: loadingConversations, togglePin } = useConversations();
  const { messages, sendMessage, sendAIMessage, sendingMessage } = useMessages(selectedConversationId || undefined);

  // Convert real data to display format
  const producerThreads: ProducerThread[] = conversations.map(conv => ({
    id: conv.producer?.id || conv.id,
    name: conv.producer?.name || "Produtor",
    farmName: conv.producer?.farm_name || "Fazenda",
    location: conv.producer?.location || "Localização não informada",
    lastMessage: conv.last_message?.content || "Sem mensagens",
    timestamp: new Date(conv.last_message?.created_at || conv.updated_at),
    unreadCount: conv.unread_count,
    hasMedia: conv.last_message?.message_type === 'image' || conv.last_message?.message_type === 'file',
    hasVoice: conv.last_message?.message_type === 'audio',
    hasEmoji: false, // Could be determined by content analysis
    isPinned: conv.is_pinned,
    avatar: conv.producer?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.producer?.name}`,
    isOnline: conv.producer?.is_online || false,
    conversationId: conv.id
  }));

  // Convert real messages to display format
  const chatMessages: ChatMessage[] = messages.map(msg => ({
    id: msg.id,
    content: msg.content,
    sender: msg.sender_type as 'user' | 'ai' | 'producer',
    timestamp: new Date(msg.created_at),
    type: msg.message_type as 'text' | 'audio' | 'image',
    isTyping: msg.metadata?.isTyping || false
  }));

  const voiceRecorder = useVoiceRecorder();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleChatSelect = (chat: ProducerThread) => {
    setSelectedChat(chat);
    setViewMode("conversation");
    setSelectedConversationId(chat.conversationId || null);
    setIsAIMode(false);
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedChat(null);
    setSelectedConversationId(null);
    setIsAIMode(false);
  };

  const handleStartAIChat = () => {
    setSelectedChat({
      id: "ai",
      name: "I.A Ludmila",
      farmName: "Assistente Virtual",
      location: "FlowAgro",
      lastMessage: "Olá! Como posso ajudar você hoje?",
      timestamp: new Date(),
      unreadCount: 0,
      hasMedia: false,
      hasVoice: false,
      hasEmoji: false,
      isPinned: false,
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ludmila",
      isOnline: true
    });
    setViewMode("conversation");
    setSelectedConversationId("ai-chat"); // Special ID for AI
    setIsAIMode(true);
  };

  // Send message function with AI integration
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageToSend = newMessage;
    setNewMessage("");

    if (isAIMode) {
      // Use the hook for AI messages
      await sendAIMessage(messageToSend);
    } else if (selectedConversationId) {
      // Use the hook for regular messages
      await sendMessage(messageToSend);
    }
  };

  const handleCamera = async () => {
    try {
      // TODO: Implement camera capture
      toast({
        title: "Camera",
        description: "Funcionalidade em desenvolvimento",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao capturar imagem",
        variant: "destructive",
      });
    }
  };

  const handleVoiceRecording = async () => {
    if (voiceRecorder.isRecording) {
      await voiceRecorder.stop();
      toast({
        title: "Gravação finalizada",
        description: "Áudio salvo com sucesso",
      });
    } else {
      await voiceRecorder.start();
      toast({
        title: "Gravação iniciada",
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
      setNewMessage(message);
    }
  };

  const handleTogglePin = async (threadId: string) => {
    const conversation = conversations.find(c => c.producer?.id === threadId || c.id === threadId);
    if (conversation) {
      await togglePin(conversation.id);
    }
  };

  // Filter and sort threads
  const filteredThreads = producerThreads.filter(thread => {
    const matchesSearch = thread.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         thread.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         thread.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const filteredAndSortedThreads = filteredThreads.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  // Check for technical map mode
  const showTechnicalMap = searchParams.get('view') === 'technical-map';
  if (showTechnicalMap) {
    return <TechnicalMapPanel />;
  }

  const renderChatList = () => (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <SyncIndicator />
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b bg-card">
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar conversas..."
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b bg-card">
        {(["Produtor", "Agenda", "IA", "Campo"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setChatFilter(filter)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors border-b-2 ${
              chatFilter === filter
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* AI Chat Button */}
      {chatFilter === "IA" && (
        <div className="p-4 border-b bg-card">
          <Button
            onClick={handleStartAIChat}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Bot className="w-4 h-4 mr-2" />
            Conversar com I.A Ludmila
          </Button>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {(loadingConversations || loadingProducers) ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Carregando conversas...</div>
            </div>
          ) : filteredAndSortedThreads.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Nenhuma conversa encontrada</div>
            </div>
          ) : (
            filteredAndSortedThreads.map((thread) => (
              <ProducerChatCard
                key={thread.id}
                chat={{
                  ...thread,
                  timestamp: thread.timestamp.toISOString()
                }}
                onClick={() => handleChatSelect(thread)}
                onTogglePin={handleTogglePin}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderConversation = () => (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToList}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={selectedChat?.avatar} />
          <AvatarFallback>{selectedChat?.name.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">{selectedChat?.name}</h2>
          <p className="text-sm text-muted-foreground">{selectedChat?.farmName}</p>
        </div>

        {selectedChat?.isOnline && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isAIMode && chatMessages.length === 0 && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-accent text-accent-foreground">
              <p className="text-sm">Olá! Sou a I.A Ludmila, sua assistente técnica agrícola. Como posso ajudar você hoje?</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
        
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : message.sender === "ai"
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-secondary-foreground"
              } ${message.isTyping ? "animate-pulse" : ""}`}
            >
              <p className="text-sm">{message.content}</p>
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
              className="flex-1"
            >
              <Sun className="w-4 h-4 mr-1" />
              Clima
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("news")}
              className="flex-1"
            >
              <Newspaper className="w-4 h-4 mr-1" />
              Notícias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("finance")}
              className="flex-1"
            >
              <DollarSign className="w-4 h-4 mr-1" />
              Financeiro
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t bg-card">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCamera}
            className="h-10 w-10 p-0"
          >
            <Camera className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleVoiceRecording}
            className={`h-10 w-10 p-0 ${voiceRecorder.isRecording ? "bg-red-100 border-red-300" : ""}`}
          >
            {voiceRecorder.isRecording ? (
              <MicOff className="h-4 w-4 text-red-600" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isAIMode ? "Pergunte à I.A Ludmila..." : "Digite sua mensagem..."}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="pr-12"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendingMessage}
            className="px-6"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-background">
      {viewMode === "list" ? renderChatList() : renderConversation()}
    </div>
  );
}