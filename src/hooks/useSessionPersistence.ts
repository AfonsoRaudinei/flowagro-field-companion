import { useState, useEffect } from 'react';

/**
 * Hook for persisting state to localStorage with session management
 */
export function useSessionPersistence<T>(
  key: string,
  defaultValue: T,
  serializer?: {
    serialize: (value: T) => string;
    deserialize: (value: string) => T;
  }
) {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`flowagro-${key}`);
      if (stored === null) {
        return defaultValue;
      }
      
      if (serializer) {
        return serializer.deserialize(stored);
      }
      
      return JSON.parse(stored);
    } catch (error) {
      console.warn(`Failed to parse stored value for key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      const valueToStore = serializer 
        ? serializer.serialize(state)
        : JSON.stringify(state);
      
      localStorage.setItem(`flowagro-${key}`, valueToStore);
    } catch (error) {
      console.warn(`Failed to store value for key "${key}":`, error);
    }
  }, [key, state, serializer]);

  return [state, setState] as const;
}

/**
 * Simple session persistence for string values
 */
export function useStringSession(key: string, defaultValue: string = '') {
  return useSessionPersistence(key, defaultValue, {
    serialize: (value) => value,
    deserialize: (value) => value
  });
}

/**
 * Session persistence for boolean values
 */
export function useBooleanSession(key: string, defaultValue: boolean = false) {
  return useSessionPersistence(key, defaultValue, {
    serialize: (value) => value.toString(),
    deserialize: (value) => value === 'true'
  });
}

/**
 * Session persistence for number values
 */
export function useNumberSession(key: string, defaultValue: number = 0) {
  return useSessionPersistence(key, defaultValue, {
    serialize: (value) => value.toString(),
    deserialize: (value) => parseFloat(value) || defaultValue
  });
}