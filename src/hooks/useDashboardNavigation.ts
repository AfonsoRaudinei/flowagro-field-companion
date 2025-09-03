import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { ProducerThread } from './useDashboardData';

/**
 * Specialized hook for managing dashboard navigation state
 * Extracted from useDashboardState for better performance
 */
export function useDashboardNavigation() {
  const [viewMode, setViewMode] = useState<"list" | "conversation">("list");
  const [selectedChat, setSelectedChat] = useState<ProducerThread | null>(null);
  const [isAIMode, setIsAIMode] = useState(false);
  const [showTechnicalChat, setShowTechnicalChat] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

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
  }, []);

  return {
    viewMode,
    selectedChat,
    isAIMode,
    showTechnicalChat,
    selectedConversationId,
    handleChatSelect,
    handleBackToList,
    handleShowTechnicalChat,
    handleBackFromTechnicalChat,
    markConversationAsSeen
  };
}