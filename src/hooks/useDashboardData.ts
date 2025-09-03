import { useMemo } from 'react';
import { useProducers } from '@/hooks/useProducers';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { performanceMonitor } from '@/lib/unifiedPerformance';

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

/**
 * Specialized hook for managing dashboard data transformations
 * Extracted from useDashboardState for better performance
 */
export function useDashboardData(selectedConversationId?: string) {
  // Real data hooks
  const { producers, loading: loadingProducers } = useProducers();
  const { conversations, loading: loadingConversations, togglePin } = useConversations();
  const { messages, sendMessage, sendAIMessage, sendingMessage } = useMessages(selectedConversationId);

  // Convert conversations to producer threads with performance monitoring
  const producerThreads: ProducerThread[] = useMemo(() => {
    return performanceMonitor.measure('producerThreads-transform', () =>
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
    return performanceMonitor.measure('chatMessages-transform', () =>
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

  return {
    producerThreads,
    chatMessages,
    loadingProducers,
    loadingConversations,
    sendMessage,
    sendAIMessage,
    sendingMessage,
    togglePin,
    conversations
  };
}