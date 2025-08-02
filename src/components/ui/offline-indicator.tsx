import React, { useState, useEffect } from 'react';
import { NetworkService, NetworkStatus } from '@/services/networkService';
import { SyncService, SyncStats } from '@/services/syncService';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface OfflineIndicatorProps {
  className?: string;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const { toast } = useToast();
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({ connected: true, connectionType: 'unknown' });
  const [syncStats, setSyncStats] = useState<SyncStats>({ totalPending: 0, synced: 0, failed: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    const initializeServices = async () => {
      try {
        await SyncService.initialize();
        
        // Get initial network status
        setNetworkStatus(NetworkService.getStatus());
        
        // Listen for network changes
        NetworkService.addListener(setNetworkStatus);
        
        // Listen for sync updates
        SyncService.addListener((stats) => {
          setSyncStats(stats);
          if (stats.synced > 0) {
            toast({
              title: "Sincronização concluída",
              description: `${stats.synced} ${stats.synced === 1 ? 'arquivo sincronizado' : 'arquivos sincronizados'}`,
              variant: "default"
            });
          }
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize offline services:', error);
      }
    };

    initializeServices();

    return () => {
      NetworkService.removeListener(setNetworkStatus);
    };
  }, [toast]);

  const handleManualSync = async () => {
    if (!networkStatus.connected) {
      toast({
        title: "Sem conexão",
        description: "Conecte-se à internet para sincronizar",
        variant: "destructive"
      });
      return;
    }

    setIsManualSyncing(true);
    try {
      const stats = await SyncService.forceSyncNow();
      if (stats.totalPending === 0) {
        toast({
          title: "Tudo sincronizado",
          description: "Não há dados pendentes para sincronizar",
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsManualSyncing(false);
    }
  };

  if (!isInitialized) {
    return null;
  }

  const isOffline = !networkStatus.connected;
  const hasPendingData = syncStats.totalPending > 0;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Network Status */}
      <div className="flex items-center space-x-1">
        {isOffline ? (
          <WifiOff className="h-4 w-4 text-orange-500" />
        ) : (
          <Wifi className="h-4 w-4 text-green-500" />
        )}
        
        {isOffline && (
          <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
            Offline
          </Badge>
        )}
      </div>

      {/* Sync Status */}
      {hasPendingData && (
        <div className="flex items-center space-x-1">
          <Button
            onClick={handleManualSync}
            disabled={isOffline || isManualSyncing}
            variant="ghost"
            size="sm"
            className="h-8 px-2"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isManualSyncing ? 'animate-spin' : ''}`} />
            <span className="text-xs">{syncStats.totalPending}</span>
          </Button>
          
          <Badge 
            variant="outline" 
            className={`text-xs ${
              syncStats.failed > 0 
                ? 'border-red-500 text-red-500' 
                : 'border-blue-500 text-blue-500'
            }`}
          >
            {syncStats.failed > 0 ? (
              <AlertCircle className="h-3 w-3 mr-1" />
            ) : (
              <CheckCircle className="h-3 w-3 mr-1" />
            )}
            {syncStats.failed > 0 ? `${syncStats.failed} erro${syncStats.failed > 1 ? 's' : ''}` : 'Pendente'}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;