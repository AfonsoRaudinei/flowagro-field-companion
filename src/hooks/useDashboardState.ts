import { useState, useCallback, useMemo } from 'react';
import { useProducers } from '@/hooks/useProducers';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';
import { PerformanceMonitor } from '@/lib/performance';
import { logger } from '@/lib/logger';

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
  const [showTechnicalChat, setShowTechnicalChat] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // Real data hooks
  const { producers, loading: loadingProducers } = useProducers();
  const { conversations, loading: loadingConversations, togglePin } = useConversations();
  const { messages, sendMessage, sendAIMessage, sendingMessage } = useMessages(selectedConversationId || undefined);

  // Convert conversations to producer threads with performance monitoring
  const producerThreads: ProducerThread[] = useMemo(() => {
    return PerformanceMonitor.measure('producerThreads-transform', () =>
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
      }))
    );
  }, [conversations]);

  // Convert messages to chat messages with performance monitoring
  const chatMessages: ChatMessage[] = useMemo(() => {
    return PerformanceMonitor.measure('chatMessages-transform', () =>
      messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender_type as 'user' | 'ai' | 'producer',
        timestamp: new Date(msg.created_at),
        type: msg.message_type as 'text' | 'audio' | 'image',
        isTyping: msg.metadata?.isTyping || false
      }))
    );
  }, [messages]);

  // Filter and sort threads with performance optimization
  const filteredAndSortedThreads = useMemo(() => {
    return PerformanceMonitor.measure('threads-filter-sort', () => {
      const searchLower = searchQuery.toLowerCase();
      const filtered = producerThreads.filter(thread => {
        if (!searchQuery) return true;
        
        return thread.name.toLowerCase().includes(searchLower) ||
               thread.farmName.toLowerCase().includes(searchLower) ||
               thread.location.toLowerCase().includes(searchLower);
      });

      return filtered.sort((a, b) => {
        // Pinned threads first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // Then by timestamp
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
    });
  }, [producerThreads, searchQuery]);

  const markConversationAsSeen = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase.rpc('update_conversation_last_seen', {
        conversation_id: conversationId
      });

      if (error) {
        logger.error('Error updating last seen', { error });
      }
    } catch (error) {
      logger.error('Error marking conversation as seen', { error });
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

  const handleShowTechnicalChat = useCallback(() => {
    setShowTechnicalChat(true);
    setIsAIMode(true);
  }, []);

  const handleBackFromTechnicalChat = useCallback(() => {
    setShowTechnicalChat(false);
    setIsAIMode(false);
    setChatFilter("Produtor");
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
    showTechnicalChat,
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
    handleShowTechnicalChat,
    handleBackFromTechnicalChat,
    handleTogglePin,
    sendMessage,
    sendAIMessage,
    markConversationAsSeen
  };
}