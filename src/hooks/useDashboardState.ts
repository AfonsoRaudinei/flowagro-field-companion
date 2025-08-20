import { useState, useCallback, useMemo } from 'react';
import { useProducers } from '@/hooks/useProducers';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';

export interface ProducerThread {
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

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'producer';
  timestamp: Date;
  type: 'text' | 'audio' | 'image';
  isTyping?: boolean;
}

export function useDashboardState() {
  const [chatFilter, setChatFilter] = useState<"Produtor" | "Agenda" | "IA" | "Campo">("Produtor");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "conversation">("list");
  const [selectedChat, setSelectedChat] = useState<ProducerThread | null>(null);
  const [isAIMode, setIsAIMode] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // Real data hooks
  const { producers, loading: loadingProducers } = useProducers();
  const { conversations, loading: loadingConversations, togglePin } = useConversations();
  const { messages, sendMessage, sendAIMessage, sendingMessage } = useMessages(selectedConversationId || undefined);

  // Convert conversations to producer threads
  const producerThreads: ProducerThread[] = useMemo(() => 
    conversations.map(conv => ({
      id: conv.producer?.id || conv.id,
      name: conv.producer?.name || "Produtor",
      farmName: conv.producer?.farm_name || "Fazenda",
      location: conv.producer?.location || "Localização não informada",
      lastMessage: conv.last_message?.content || "Sem mensagens",
      timestamp: new Date(conv.last_message?.created_at || conv.updated_at),
      unreadCount: conv.unread_count,
      hasMedia: conv.last_message?.message_type === 'image' || conv.last_message?.message_type === 'file',
      hasVoice: conv.last_message?.message_type === 'audio',
      hasEmoji: false,
      isPinned: conv.is_pinned,
      avatar: conv.producer?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.producer?.name}`,
      isOnline: conv.producer?.is_online || false,
      conversationId: conv.id
    })), [conversations]
  );

  // Convert messages to chat messages
  const chatMessages: ChatMessage[] = useMemo(() => 
    messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      sender: msg.sender_type as 'user' | 'ai' | 'producer',
      timestamp: new Date(msg.created_at),
      type: msg.message_type as 'text' | 'audio' | 'image',
      isTyping: msg.metadata?.isTyping || false
    })), [messages]
  );

  // Filter and sort threads
  const filteredAndSortedThreads = useMemo(() => {
    const filtered = producerThreads.filter(thread => {
      const searchLower = searchQuery.toLowerCase();
      return thread.name.toLowerCase().includes(searchLower) ||
             thread.farmName.toLowerCase().includes(searchLower) ||
             thread.location.toLowerCase().includes(searchLower);
    });

    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [producerThreads, searchQuery]);

  const markConversationAsSeen = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase.rpc('update_conversation_last_seen', {
        conversation_id: conversationId
      });

      if (error) {
        console.error('Error updating last seen:', error);
      }
    } catch (error) {
      console.error('Error marking conversation as seen:', error);
    }
  }, []);

  const handleChatSelect = useCallback((chat: ProducerThread) => {
    setSelectedChat(chat);
    setViewMode("conversation");
    setSelectedConversationId(chat.conversationId || null);
    setIsAIMode(false);
    
    // Mark conversation as seen
    if (chat.conversationId) {
      markConversationAsSeen(chat.conversationId);
    }
  }, [markConversationAsSeen]);

  const handleBackToList = useCallback(() => {
    setViewMode("list");
    setSelectedChat(null);
    setSelectedConversationId(null);
    setIsAIMode(false);
  }, []);

  const handleStartAIChat = useCallback(() => {
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
    setSelectedConversationId("ai-chat");
    setIsAIMode(true);
  }, []);

  const handleTogglePin = useCallback(async (threadId: string) => {
    const conversation = conversations.find(c => c.producer?.id === threadId || c.id === threadId);
    if (conversation) {
      await togglePin(conversation.id);
    }
  }, [conversations, togglePin]);

  return {
    // State
    chatFilter,
    setChatFilter,
    searchQuery,
    setSearchQuery,
    viewMode,
    selectedChat,
    isAIMode,
    selectedConversationId,
    
    // Data
    producerThreads: filteredAndSortedThreads,
    chatMessages,
    loadingProducers,
    loadingConversations,
    sendingMessage,
    
    // Actions
    handleChatSelect,
    handleBackToList,
    handleStartAIChat,
    handleTogglePin,
    sendMessage,
    sendAIMessage,
    markConversationAsSeen
  };
}