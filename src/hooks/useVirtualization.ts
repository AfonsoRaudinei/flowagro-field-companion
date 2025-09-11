/**
 * Enhanced Virtualization Hook - Fase 2 Otimização
 * Hook otimizado para virtualização de listas longas
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useMemoryOptimization } from './useMemoryOptimization';

interface VirtualizationConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  threshold?: number;
  enableDynamicHeight?: boolean;
}

interface VirtualizationReturn<T> {
  containerProps: {
    style: React.CSSProperties;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  };
  itemProps: (index: number) => {
    style: React.CSSProperties;
    'data-index': number;
  };
  visibleItems: T[];
  scrollToIndex: (index: number) => void;
  isScrolling: boolean;
}

export function useVirtualization<T>(
  items: T[],
  config: VirtualizationConfig
): VirtualizationReturn<T> {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    threshold = 0.1,
    enableDynamicHeight = false
  } = config;

  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>();
  const itemHeightsRef = useRef<Map<number, number>>(new Map());
  
  // Memory optimization for large lists
  const { registerCleanupTask } = useMemoryOptimization({
    threshold: 80,
    onMemoryPressure: () => {
      // Clear cached heights for items not visible
      const visibleStart = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const visibleEnd = Math.min(items.length, visibleStart + Math.ceil(containerHeight / itemHeight) + overscan * 2);
      
      itemHeightsRef.current.forEach((height, index) => {
        if (index < visibleStart || index > visibleEnd) {
          itemHeightsRef.current.delete(index);
        }
      });
    }
  });

  // Calculate visible range with dynamic heights
  const { visibleStart, visibleEnd, totalHeight } = useMemo(() => {
    if (!enableDynamicHeight) {
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const end = Math.min(
        items.length,
        start + Math.ceil(containerHeight / itemHeight) + overscan * 2
      );
      
      return {
        visibleStart: start,
        visibleEnd: end,
        totalHeight: items.length * itemHeight
      };
    }

    // Dynamic height calculation
    let accumulatedHeight = 0;
    let start = 0;
    let end = items.length;

    // Find visible start
    for (let i = 0; i < items.length; i++) {
      const height = itemHeightsRef.current.get(i) || itemHeight;
      if (accumulatedHeight + height > scrollTop) {
        start = Math.max(0, i - overscan);
        break;
      }
      accumulatedHeight += height;
    }

    // Find visible end
    accumulatedHeight = 0;
    for (let i = start; i < items.length; i++) {
      const height = itemHeightsRef.current.get(i) || itemHeight;
      accumulatedHeight += height;
      if (accumulatedHeight > containerHeight + scrollTop - (start * itemHeight)) {
        end = Math.min(items.length, i + overscan);
        break;
      }
    }

    // Calculate total height
    let total = 0;
    for (let index = 0; index < items.length; index++) {
      const height = itemHeightsRef.current.get(index) || itemHeight;
      total += height;
    }

    return {
      visibleStart: start,
      visibleEnd: end,
      totalHeight: total
    };
  }, [scrollTop, items.length, itemHeight, containerHeight, overscan, enableDynamicHeight]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleStart, visibleEnd);
  }, [items, visibleStart, visibleEnd]);

  // Scroll handler with throttling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set scrolling to false after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  // Scroll to index function
  const scrollToIndex = useCallback((index: number) => {
    if (!containerRef.current) return;

    let targetScrollTop = 0;
    if (enableDynamicHeight) {
      for (let i = 0; i < index; i++) {
        targetScrollTop += itemHeightsRef.current.get(i) || itemHeight;
      }
    } else {
      targetScrollTop = index * itemHeight;
    }

    containerRef.current.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
  }, [itemHeight, enableDynamicHeight]);

  // Container props
  const containerProps = useMemo(() => ({
    style: {
      height: containerHeight,
      overflow: 'auto' as const,
      position: 'relative' as const
    } satisfies React.CSSProperties,
    onScroll: handleScroll
  }), [containerHeight, handleScroll]);

  // Item props generator
  const itemProps = useCallback((index: number) => {
    const actualIndex = visibleStart + index;
    let offsetTop = 0;

    if (enableDynamicHeight) {
      for (let i = 0; i < actualIndex; i++) {
        offsetTop += itemHeightsRef.current.get(i) || itemHeight;
      }
    } else {
      offsetTop = actualIndex * itemHeight;
    }

    return {
      style: {
        position: 'absolute' as const,
        top: offsetTop,
        left: 0,
        right: 0,
        height: itemHeightsRef.current.get(actualIndex) || itemHeight
      } satisfies React.CSSProperties,
      'data-index': actualIndex
    };
  }, [visibleStart, itemHeight, enableDynamicHeight]);

  // Register memory cleanup
  useEffect(() => {
    const cleanup = () => {
      if (itemHeightsRef.current.size > 1000) {
        itemHeightsRef.current.clear();
      }
    };
    registerCleanupTask(cleanup);
  }, [registerCleanupTask]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    containerProps,
    itemProps,
    visibleItems,
    scrollToIndex,
    isScrolling
  };
}

// Hook for intersection-based loading
export function useIntersectionVirtualization<T>(
  items: T[],
  config: VirtualizationConfig & { loadMoreThreshold?: number }
) {
  const virtualization = useVirtualization(items, config);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  const { loadMoreThreshold = 5 } = config;

  // Check if we need to load more items
  useEffect(() => {
    const { visibleItems } = virtualization;
    const remainingItems = items.length - (virtualization as any).visibleEnd;

    if (remainingItems <= loadMoreThreshold && !loadingRef.current && hasMore) {
      loadingRef.current = true;
      // Trigger load more (would be handled by parent component)
      setTimeout(() => {
        loadingRef.current = false;
      }, 1000);
    }
  }, [virtualization, items.length, loadMoreThreshold, hasMore]);

  return {
    ...virtualization,
    hasMore,
    setHasMore,
    isLoading: loadingRef.current
  };
}