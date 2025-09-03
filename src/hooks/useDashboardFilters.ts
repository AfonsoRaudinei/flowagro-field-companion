import { useState, useMemo } from 'react';
import { ProducerThread } from './useDashboardData';

/**
 * Specialized hook for managing dashboard filters and search
 * Extracted from useDashboardState for better performance
 */
export function useDashboardFilters() {
  const [chatFilter, setChatFilter] = useState<"Produtor" | "Agenda" | "IA" | "Campo">("Produtor");
  const [searchQuery, setSearchQuery] = useState("");

  // Optimized filter function with memoization
  const filterThreads = useMemo(() => (threads: ProducerThread[]) => {
    if (!searchQuery) return threads;
    
    const searchLower = searchQuery.toLowerCase();
    return threads.filter(thread => {
      return thread.name.toLowerCase().includes(searchLower) ||
             thread.farmName.toLowerCase().includes(searchLower) ||
             thread.location.toLowerCase().includes(searchLower);
    });
  }, [searchQuery]);

  // Sort function with memoization
  const sortThreads = useMemo(() => (threads: ProducerThread[]) => {
    return threads.sort((a, b) => {
      // Pinned threads first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then by timestamp
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, []);

  return {
    chatFilter,
    setChatFilter,
    searchQuery,
    setSearchQuery,
    filterThreads,
    sortThreads
  };
}