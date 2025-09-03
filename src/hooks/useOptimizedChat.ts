import { useCallback, useRef, useEffect } from 'react';
import { useMessages } from './useMessages';
import { useConversations } from './useConversations';
import { performanceMonitor } from '@/lib/unifiedPerformance';
import { logger } from '@/lib/logger';

/**
 * Optimized chat hook with proper cleanup and performance monitoring
 */
export function useOptimizedChat(conversationId?: string) {
  const messagesHook = useMessages(conversationId);
  const conversationsHook = useConversations();
  
  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Optimized send message with debouncing
  const debouncedSendMessage = useCallback(async (
    content: string,
    messageType: 'text' | 'audio' | 'image' | 'file' = 'text'
  ) => {
    // Cancel previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    return performanceMonitor.measure('chat-send-message', async () => {
      // Abort previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      
      try {
        return await messagesHook.sendMessage(content, messageType);
      } catch (error) {
        if (!abortControllerRef.current?.signal.aborted) {
          logger.error('Send message failed', { error, conversationId });
        }
        throw error;
      }
    });
  }, [messagesHook.sendMessage, conversationId]);

  // Optimized send AI message with timeout
  const debouncedSendAIMessage = useCallback(async (userMessage: string) => {
    return performanceMonitor.measure('chat-send-ai-message', async () => {
      const timeout = new Promise((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error('AI message timeout'));
        }, 30000); // 30 second timeout
      });

      try {
        const result = await Promise.race([
          messagesHook.sendAIMessage(userMessage),
          timeout
        ]);
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        return result;
      } catch (error) {
        logger.error('AI message failed', { error, userMessage });
        throw error;
      }
    });
  }, [messagesHook.sendAIMessage]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      logger.debug('Chat hook cleanup completed', { conversationId });
    };
  }, [conversationId]);

  return {
    // Messages
    messages: messagesHook.messages,
    loadingMessages: messagesHook.loading,
    sendingMessage: messagesHook.sendingMessage,
    
    // Conversations
    conversations: conversationsHook.conversations,
    loadingConversations: conversationsHook.loading,
    
    // Optimized actions
    sendMessage: debouncedSendMessage,
    sendAIMessage: debouncedSendAIMessage,
    togglePin: conversationsHook.togglePin,
    createConversation: conversationsHook.createConversation,
    
    // Refetch functions
    refetchMessages: messagesHook.refetch,
    refetchConversations: conversationsHook.refetch
  };
}