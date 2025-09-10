import { useState, useMemo, useCallback } from 'react';
import { ProducerThread } from './useDashboardData';

/**
 * Optimized hook for managing dashboard filters and search with better performance
 * Enhanced with proper memoization and callback optimization
 */
export function useDashboardFilters() {
  const [chatFilter, setChatFilter] = useState<"Produtor" | "Agenda" | "IA" | "Campo">("Produtor");
  const [searchQuery, setSearchQuery] = useState("");

  // Debounced search query for better performance
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // Performance-optimized filter function with proper memoization
  const filterThreads = useCallback((threads: ProducerThread[]) => {
    if (!debouncedQuery.trim()) return threads;
    
    const searchLower = debouncedQuery.toLowerCase();
    return threads.filter(thread => {
      // Pre-compute lowercase values to avoid repeated operations
      const nameMatch = thread.name.toLowerCase().includes(searchLower);
      const farmMatch = thread.farmName.toLowerCase().includes(searchLower);
      const locationMatch = thread.location.toLowerCase().includes(searchLower);
      
      return nameMatch || farmMatch || locationMatch;
    });
  }, [debouncedQuery]);

  // Optimized sort function with stable sorting
  const sortThreads = useCallback((threads: ProducerThread[]) => {
    return [...threads].sort((a, b) => {
      // Pinned threads first - use Number() for consistent comparison
      const aPinned = Number(a.isPinned);
      const bPinned = Number(b.isPinned);
      
      if (aPinned !== bPinned) {
        return bPinned - aPinned; // Pinned items first
      }
      
      // Then by timestamp (newest first)
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, []);

  // Debounce search query updates
  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    
    // Debounce the actual filtering
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Memoized combined filter and sort operation
  const processThreads = useMemo(() => {
    return (threads: ProducerThread[]) => {
      const filtered = filterThreads(threads);
      return sortThreads(filtered);
    };
  }, [filterThreads, sortThreads]);

  return {
    chatFilter,
    setChatFilter,
    searchQuery,
    setSearchQuery: updateSearchQuery,
    filterThreads,
    sortThreads,
    processThreads, // New combined operation
    debouncedQuery // Expose for debugging if needed
  };
}