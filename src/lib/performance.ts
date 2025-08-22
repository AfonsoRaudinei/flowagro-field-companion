import React, { useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { recordMetric } from '@/lib/metrics';

/**
 * Debounce hook for optimizing performance on rapid input changes
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

/**
 * Throttle hook for limiting function calls per time period
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - (now - lastCallRef.current));
    }
  }, [callback, delay]) as T;
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, number>();

  static start(key: string): void {
    this.measurements.set(key, performance.now());
  }

  static end(key: string): number {
    const start = this.measurements.get(key);
    if (!start) return 0;
    
    const duration = performance.now() - start;
    this.measurements.delete(key);
    
    if (import.meta.env.DEV) {
      console.log(`[PERF] ${key}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  static measure<T>(key: string, fn: () => T): T {
    this.start(key);
    const result = fn();
    this.end(key);
    return result;
  }

  static async measureAsync<T>(key: string, fn: () => Promise<T>): Promise<T> {
    this.start(key);
    const result = await fn();
    this.end(key);
    return result;
  }
}

/**
 * Shallow compare utility for React.memo
 */
export function shallowEqual<T extends Record<string, any>>(
  obj1: T, 
  obj2: T
): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) {
    return false;
  }
  
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Memory usage monitoring (Development only)
 */
export class MemoryMonitor {
  static logMemoryUsage(context?: string): void {
    if (!import.meta.env.DEV || !(performance as any).memory) return;
    
    const memory = (performance as any).memory;
    const used = Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100;
    const total = Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100;
    
    console.log(`[MEMORY${context ? ` ${context}` : ''}] Used: ${used}MB / Total: ${total}MB`);
  }
}

/**
 * Batch updates utility for reducing re-renders
 */
export function batchUpdates<T>(
  updates: Array<() => void>,
  callback?: () => void
): void {
  // Use React's unstable_batchedUpdates if available
  if (typeof (window as any).React?.unstable_batchedUpdates === 'function') {
    (window as any).React.unstable_batchedUpdates(() => {
      updates.forEach(update => update());
      callback?.();
    });
  } else {
    // Fallback to sequential updates
    updates.forEach(update => update());
    callback?.();
  }
}