import React, { useMemo, useCallback } from 'react';
import { useDashboardData, ProducerThread, ChatMessage } from './useDashboardData';
import { useDashboardFilters } from './useDashboardFilters';
import { useDashboardNavigation } from './useDashboardNavigation';
import { performanceMonitor } from '@/lib/unifiedPerformance';

// Re-export types for compatibility
export type { ProducerThread, ChatMessage };

/**
 * Optimized dashboard state hook - now composed of specialized hooks
 * for better performance and maintainability
 */
export function useDashboardState() {
  // Specialized hooks for different concerns
  const filters = useDashboardFilters();
  const navigation = useDashboardNavigation();
  const data = useDashboardData(navigation.selectedConversationId || undefined);

  // Filter and sort threads with performance optimization
  const filteredAndSortedThreads = useMemo(() => {
    return performanceMonitor.measure('threads-filter-sort', () => {
      const filtered = filters.filterThreads(data.producerThreads);
      return filters.sortThreads(filtered);
    });
  }, [data.producerThreads, filters.filterThreads, filters.sortThreads]);

  const handleTogglePin = useCallback(async (threadId: string) => {
    const conversation = data.conversations.find(c => c.producer?.id === threadId || c.id === threadId);
    if (conversation) {
      await data.togglePin(conversation.id);
    }
  }, [data.conversations, data.togglePin]);

  const handleBackFromTechnicalChat = useCallback(() => {
    navigation.handleBackFromTechnicalChat();
    filters.setChatFilter("Produtor");
  }, [navigation, filters]);

  return {
    // State from filters
    chatFilter: filters.chatFilter,
    setChatFilter: filters.setChatFilter,
    searchQuery: filters.searchQuery,
    setSearchQuery: filters.setSearchQuery,
    
    // State from navigation (enhanced)
    viewMode: navigation.viewMode,
    selectedChat: navigation.selectedChat,
    isAIMode: navigation.isAIMode,
    showTechnicalChat: navigation.showTechnicalChat,
    selectedConversationId: navigation.selectedConversationId,
    isTransitioning: navigation.isTransitioning,
    
    // Data
    producerThreads: filteredAndSortedThreads,
    chatMessages: data.chatMessages,
    loadingProducers: data.loadingProducers,
    loadingConversations: data.loadingConversations,
    sendingMessage: data.sendingMessage,
    
    // Enhanced Navigation Actions
    handleChatSelect: navigation.handleChatSelect,
    handleBackToList: navigation.handleBackToList,
    handleShowTechnicalChat: navigation.handleShowTechnicalChat,
    handleBackFromTechnicalChat,
    handleSmartBack: navigation.handleSmartBack,
    handleTogglePin,
    sendMessage: data.sendMessage,
    sendAIMessage: data.sendAIMessage,
    markConversationAsSeen: navigation.markConversationAsSeen,
    
    // Navigation utilities
    navigationHistory: navigation.navigationHistory
  };
}