import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { ProducerThread } from './useDashboardData';

// Navigation history for better UX
interface NavigationState {
  viewMode: "list" | "conversation";
  selectedChat: ProducerThread | null;
  isAIMode: boolean;
  showTechnicalChat: boolean;
  timestamp: number;
}

/**
 * Enhanced hook for managing dashboard navigation state with history and animations
 * Extracted from useDashboardState for better performance and UX
 */
export function useDashboardNavigation() {
  const [viewMode, setViewMode] = useState<"list" | "conversation">("list");
  const [selectedChat, setSelectedChat] = useState<ProducerThread | null>(null);
  const [isAIMode, setIsAIMode] = useState(false);
  const [showTechnicalChat, setShowTechnicalChat] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Navigation history stack for back navigation
  const navigationHistory = useRef<NavigationState[]>([]);
  const currentStateRef = useRef<NavigationState | null>(null);

  // Save current state to history before navigation
  const saveToHistory = useCallback(() => {
    const currentState: NavigationState = {
      viewMode,
      selectedChat,
      isAIMode,
      showTechnicalChat,
      timestamp: Date.now()
    };
    
    // Only save if state is different from current
    if (currentStateRef.current && 
        JSON.stringify(currentState) !== JSON.stringify(currentStateRef.current)) {
      navigationHistory.current.push(currentStateRef.current);
      // Keep history limited to last 10 states
      if (navigationHistory.current.length > 10) {
        navigationHistory.current = navigationHistory.current.slice(-10);
      }
    }
    
    currentStateRef.current = currentState;
  }, [viewMode, selectedChat, isAIMode, showTechnicalChat]);

  // Enhanced navigation with transitions
  const navigateWithTransition = useCallback(async (action: () => void) => {
    setIsTransitioning(true);
    saveToHistory();
    
    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 50));
    action();
    
    // Reset transition after animation
    setTimeout(() => setIsTransitioning(false), 300);
  }, [saveToHistory]);

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
    navigateWithTransition(() => {
      setSelectedChat(chat);
      setViewMode("conversation");
      setSelectedConversationId(chat.conversationId || null);
      setIsAIMode(false);
    });
    
    // Mark conversation as seen
    if (chat.conversationId) {
      markConversationAsSeen(chat.conversationId);
    }
  }, [navigateWithTransition, markConversationAsSeen]);

  const handleBackToList = useCallback(() => {
    navigateWithTransition(() => {
      setViewMode("list");
      setSelectedChat(null);
      setSelectedConversationId(null);
      setIsAIMode(false);
    });
  }, [navigateWithTransition]);

  const handleShowTechnicalChat = useCallback(() => {
    navigateWithTransition(() => {
      setShowTechnicalChat(true);
      setIsAIMode(true);
    });
  }, [navigateWithTransition]);

  const handleBackFromTechnicalChat = useCallback(() => {
    navigateWithTransition(() => {
      setShowTechnicalChat(false);
      setIsAIMode(false);
    });
  }, [navigateWithTransition]);

  // Smart back navigation using history
  const handleSmartBack = useCallback(() => {
    const lastState = navigationHistory.current.pop();
    
    if (lastState) {
      navigateWithTransition(() => {
        setViewMode(lastState.viewMode);
        setSelectedChat(lastState.selectedChat);
        setIsAIMode(lastState.isAIMode);
        setShowTechnicalChat(lastState.showTechnicalChat);
        setSelectedConversationId(
          lastState.selectedChat?.conversationId || null
        );
      });
    } else {
      // Fallback to list view if no history
      handleBackToList();
    }
  }, [navigateWithTransition, handleBackToList]);

  return {
    viewMode,
    selectedChat,
    isAIMode,
    showTechnicalChat,
    selectedConversationId,
    isTransitioning,
    handleChatSelect,
    handleBackToList,
    handleShowTechnicalChat,
    handleBackFromTechnicalChat,
    handleSmartBack,
    markConversationAsSeen,
    navigationHistory: navigationHistory.current
  };
}