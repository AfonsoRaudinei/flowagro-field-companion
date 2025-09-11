/**
 * Service Worker Integration Hook - Fase 2 Otimização
 * Gerencia instalação e updates do Service Worker
 */

import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

interface ServiceWorkerState {
  isSupported: boolean;
  isInstalled: boolean;
  isWaitingForUpdate: boolean;
  isOnline: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isInstalled: false,
    isWaitingForUpdate: false,
    isOnline: navigator.onLine,
    registration: null
  });

  const { toast } = useToast();

  useEffect(() => {
    if (!state.isSupported) return;

    registerServiceWorker();
    setupOnlineStatusListener();
  }, [state.isSupported]);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      setState(prev => ({ 
        ...prev, 
        isInstalled: true, 
        registration 
      }));

      console.log('[SW] Service Worker registered successfully');

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setState(prev => ({ ...prev, isWaitingForUpdate: true }));
            
            toast({
              title: "Nova versão disponível",
              description: "Clique para atualizar o app",
            action: undefined,
              duration: 0 // Não remove automaticamente
            });
          }
        });
      });

      // Check for existing updates
      if (registration.waiting) {
        setState(prev => ({ ...prev, isWaitingForUpdate: true }));
      }

    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
    }
  };

  const updateServiceWorker = () => {
    if (!state.registration?.waiting) return;

    // Send message to skip waiting
    state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Listen for controlling state change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  };

  const setupOnlineStatusListener = () => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      
      // Trigger background sync when coming online (if supported)
      if (state.registration && 'serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype) {
        try {
          (state.registration as any).sync?.register('background-sync');
        } catch {
          console.log('[SW] Background sync not supported');
        }
      }

      toast({
        title: "Conexão restaurada",
        description: "Sincronizando dados...",
        duration: 3000
      });
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      
      toast({
        title: "Você está offline",
        description: "Algumas funcionalidades podem estar limitadas",
        duration: 5000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };

  // Preload critical resources
  const preloadResources = async (urls: string[]) => {
    if (!state.isInstalled || !state.registration) return;

    try {
      const cache = await caches.open('flowagro-preload');
      await cache.addAll(urls);
      
      console.log('[SW] Resources preloaded successfully');
    } catch (error) {
      console.error('[SW] Failed to preload resources:', error);
    }
  };

  // Clear old caches
  const clearOldCaches = async () => {
    try {
      const cacheNames = await caches.keys();
      const currentCaches = ['flowagro-v2.1.0', 'flowagro-dynamic-v1.0.0'];
      
      const deletePromises = cacheNames
        .filter(name => !currentCaches.includes(name))
        .map(name => caches.delete(name));

      await Promise.all(deletePromises);
      
      console.log('[SW] Old caches cleared');
      
      toast({
        title: "Cache limpo",
        description: "Espaço liberado com sucesso",
        duration: 3000
      });
      
    } catch (error) {
      console.error('[SW] Failed to clear caches:', error);
    }
  };

  // Get cache stats
  const getCacheStats = async () => {
    try {
      const cacheNames = await caches.keys();
      const stats = await Promise.all(
        cacheNames.map(async (name) => {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          return { name, count: keys.length };
        })
      );
      
      return stats;
    } catch (error) {
      console.error('[SW] Failed to get cache stats:', error);
      return [];
    }
  };

  // Force cache update
  const forceCacheUpdate = async () => {
    if (!state.registration) return;

    try {
      await state.registration.update();
      
      toast({
        title: "Verificando atualizações",
        description: "Cache sendo atualizado...",
        duration: 3000
      });
      
    } catch (error) {
      console.error('[SW] Failed to update cache:', error);
    }
  };

  return {
    ...state,
    updateServiceWorker,
    preloadResources,
    clearOldCaches,
    getCacheStats,
    forceCacheUpdate
  };
}

// Hook para cache manual de recursos
export function useResourceCache() {
  const cacheResource = async (url: string, cacheName = 'flowagro-dynamic-v1.0.0') => {
    if (!('caches' in window)) {
      console.warn('Cache API not supported');
      return false;
    }

    try {
      const cache = await caches.open(cacheName);
      const response = await fetch(url);
      
      if (response.ok) {
        await cache.put(url, response.clone());
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to cache resource:', error);
      return false;
    }
  };

  const getCachedResource = async (url: string) => {
    if (!('caches' in window)) return null;

    try {
      const response = await caches.match(url);
      return response || null;
    } catch (error) {
      console.error('Failed to get cached resource:', error);
      return null;
    }
  };

  const removeCachedResource = async (url: string, cacheName = 'flowagro-dynamic-v1.0.0') => {
    if (!('caches' in window)) return false;

    try {
      const cache = await caches.open(cacheName);
      return await cache.delete(url);
    } catch (error) {
      console.error('Failed to remove cached resource:', error);
      return false;
    }
  };

  return {
    cacheResource,
    getCachedResource,
    removeCachedResource
  };
}