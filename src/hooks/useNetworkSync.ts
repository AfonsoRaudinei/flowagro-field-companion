import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { NetworkService, NetworkStatus } from '@/services/networkService';
import { SyncService, SyncStats } from '@/services/syncService';
import { useToast } from '@/hooks/use-toast';

export interface NetworkSyncState {
  networkStatus: NetworkStatus;
  syncStats: SyncStats;
  isInitialized: boolean;
  isManualSyncing: boolean;
}

export function useNetworkSync() {
  const { toast } = useToast();
  const [state, setState] = useState<NetworkSyncState>({
    networkStatus: { connected: true, connectionType: 'unknown' },
    syncStats: { totalPending: 0, synced: 0, failed: 0 },
    isInitialized: false,
    isManualSyncing: false
  });

  useEffect(() => {
    const initializeServices = async () => {
      try {
        await SyncService.initialize();
        
        const networkStatus = NetworkService.getStatus();
        setState(prev => ({ ...prev, networkStatus, isInitialized: true }));
        
        // Listen for network changes
        NetworkService.addListener((status) => {
          setState(prev => ({ ...prev, networkStatus: status }));
        });
        
        // Listen for sync updates
        SyncService.addListener((stats) => {
          setState(prev => ({ ...prev, syncStats: stats, isManualSyncing: false }));
          
          if (stats.synced > 0) {
            toast({
              title: "✅ Sincronização concluída",
              description: `${stats.synced} ${stats.synced === 1 ? 'arquivo sincronizado' : 'arquivos sincronizados'}`,
              variant: "default"
            });
          }
        });

      } catch (error) {
        logger.error('Failed to initialize network sync services', { error });
      }
    };

    initializeServices();

    return () => {
      NetworkService.removeListener((status) => {
        setState(prev => ({ ...prev, networkStatus: status }));
      });
    };
  }, [toast]);

  const forceSync = useCallback(async () => {
    if (!state.networkStatus.connected) {
      toast({
        title: "📶 Sem conexão",
        description: "Conecte-se à internet para sincronizar",
        variant: "destructive"
      });
      return;
    }

    setState(prev => ({ ...prev, isManualSyncing: true }));
    
    try {
      const stats = await SyncService.forceSyncNow();
      
      if (stats.totalPending === 0) {
        toast({
          title: "✅ Tudo sincronizado",
          description: "Não há dados pendentes para sincronizar",
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "❌ Erro na sincronização",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, isManualSyncing: false }));
    }
  }, [state.networkStatus.connected, toast]);

  return {
    ...state,
    forceSync,
    isOffline: !state.networkStatus.connected,
    hasPendingData: state.syncStats.totalPending > 0,
    hasErrors: state.syncStats.failed > 0
  };
}