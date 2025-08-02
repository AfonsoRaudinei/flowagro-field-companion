import React, { useState, useEffect } from 'react';
import { NetworkService, NetworkStatus } from '@/services/networkService';
import { SyncService, SyncStats } from '@/services/syncService';
import { CheckCircle, RefreshCw, CloudOff, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SyncIndicatorProps {
  className?: string;
}

const SyncIndicator: React.FC<SyncIndicatorProps> = ({ className = '' }) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({ connected: true, connectionType: 'unknown' });
  const [syncStats, setSyncStats] = useState<SyncStats>({ totalPending: 0, synced: 0, failed: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

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
          setIsSyncing(false); // Sync completed
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize sync indicator:', error);
      }
    };

    initializeServices();

    return () => {
      NetworkService.removeListener(setNetworkStatus);
    };
  }, []);

  const getSyncState = () => {
    const isOffline = !networkStatus.connected;
    const hasPendingData = syncStats.totalPending > 0;

    if (isOffline) {
      return {
        icon: CloudOff,
        color: 'text-red-500',
        tooltip: 'Trabalhando offline - dados serão sincronizados quando houver conexão',
        bgColor: 'bg-red-50 border-red-200'
      };
    }

    if (isSyncing) {
      return {
        icon: RefreshCw,
        color: 'text-blue-500',
        tooltip: 'Sincronizando dados...',
        bgColor: 'bg-blue-50 border-blue-200',
        animate: true
      };
    }

    if (hasPendingData) {
      return {
        icon: RefreshCw,
        color: 'text-orange-500',
        tooltip: `${syncStats.totalPending} ${syncStats.totalPending === 1 ? 'arquivo pendente' : 'arquivos pendentes'} para sincronização`,
        bgColor: 'bg-orange-50 border-orange-200'
      };
    }

    return {
      icon: CheckCircle,
      color: 'text-green-500',
      tooltip: 'Todos os dados estão sincronizados',
      bgColor: 'bg-green-50 border-green-200'
    };
  };

  const handleManualSync = async () => {
    if (!networkStatus.connected) return;

    setIsSyncing(true);
    try {
      await SyncService.forceSyncNow();
    } catch (error) {
      console.error('Manual sync failed:', error);
      setIsSyncing(false);
    }
  };

  if (!isInitialized) {
    return null;
  }

  const state = getSyncState();
  const IconComponent = state.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleManualSync}
            disabled={!networkStatus.connected || isSyncing}
            variant="ghost"
            size="sm"
            className={`
              w-8 h-8 p-0 rounded-full shadow-sm border backdrop-blur-sm
              ${state.bgColor}
              hover:scale-105 transition-all duration-200
              ${className}
            `}
          >
            <IconComponent 
              className={`
                h-4 w-4 ${state.color}
                ${state.animate ? 'animate-spin' : ''}
              `} 
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">{state.tooltip}</p>
          {syncStats.totalPending > 0 && networkStatus.connected && (
            <p className="text-xs text-muted-foreground mt-1">
              Toque para sincronizar agora
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SyncIndicator;