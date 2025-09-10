import React, { useMemo, useCallback, memo } from 'react';
import { useDashboardData, ProducerThread, ChatMessage } from './useDashboardData';
import { useDashboardFilters } from './useDashboardFilters';
import { useDashboardNavigation } from './useDashboardNavigation';
import { performanceMonitor } from '@/lib/unifiedPerformance';

// Re-export types for compatibility
export type { ProducerThread, ChatMessage };

/**
 * Highly optimized dashboard state hook with performance monitoring
 * Enhanced with React.memo patterns and advanced memoization
 */
export function useDashboardState() {
  // Specialized hooks for different concerns
  const filters = useDashboardFilters();
  const navigation = useDashboardNavigation();
  const data = useDashboardData(navigation.selectedConversationId || undefined);

  // Optimized filter and sort with performance monitoring
  const filteredAndSortedThreads = useMemo(() => {
    return performanceMonitor.measure('threads-filter-sort', () => {
      // Use the new combined operation for better performance
      return filters.processThreads(data.producerThreads);
    });
  }, [data.producerThreads, filters.processThreads]);

  // Memoized toggle pin handler with optimistic updates
  const handleTogglePin = useCallback(async (threadId: string) => {
    const conversation = data.conversations.find(c => 
      c.producer?.id === threadId || c.id === threadId
    );
    if (conversation) {
      // Optimistic update could be added here for better UX
      await data.togglePin(conversation.id);
    }
  }, [data.conversations, data.togglePin]);

  // Enhanced back handler with filter reset
  const handleBackFromTechnicalChat = useCallback(() => {
    navigation.handleBackFromTechnicalChat();
    filters.setChatFilter("Produtor");
  }, [navigation, filters]);

  // Memoized loading state
  const isLoading = useMemo(() => {
    return data.loadingProducers || data.loadingConversations;
  }, [data.loadingProducers, data.loadingConversations]);

  // Performance metrics for debugging
  const performanceMetrics = useMemo(() => ({
    threadCount: data.producerThreads.length,
    filteredCount: filteredAndSortedThreads.length,
    isTransitioning: navigation.isTransitioning,
    hasSearch: Boolean(filters.searchQuery.trim())
  }), [
    data.producerThreads.length,
    filteredAndSortedThreads.length,
    navigation.isTransitioning,
    filters.searchQuery
  ]);

  return {
    // State from filters (optimized)
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
    
    // Optimized data
    producerThreads: filteredAndSortedThreads,
    chatMessages: data.chatMessages,
    loadingProducers: data.loadingProducers,
    loadingConversations: data.loadingConversations,
    sendingMessage: data.sendingMessage,
    isLoading, // Combined loading state
    
    // Enhanced Navigation Actions (memoized)
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
    navigationHistory: navigation.navigationHistory,
    
    // Performance debugging (development only)
    performanceMetrics: process.env.NODE_ENV === 'development' ? performanceMetrics : undefined
  };
}