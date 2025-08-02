import { NetworkService } from './networkService';
import { OfflineStorageService, OfflineData, SyncStatus } from './offlineStorageService';

export interface SyncStats {
  totalPending: number;
  synced: number;
  failed: number;
}

export class SyncService {
  private static isRunning = false;
  private static syncInterval: NodeJS.Timeout | null = null;
  private static listeners: ((stats: SyncStats) => void)[] = [];

  static async initialize(): Promise<void> {
    // Initialize dependencies
    await NetworkService.initialize();
    await OfflineStorageService.initialize();

    // Listen for network changes
    NetworkService.addListener((status) => {
      if (status.connected && !this.isRunning) {
        this.startPeriodicSync();
      } else if (!status.connected) {
        this.stopPeriodicSync();
      }
    });

    // Start sync if online
    if (NetworkService.isOnline()) {
      this.startPeriodicSync();
    }
  }

  static startPeriodicSync(): void {
    if (this.syncInterval) return;

    // Immediate sync
    this.syncPendingData();

    // Then every 2 minutes
    this.syncInterval = setInterval(() => {
      this.syncPendingData();
    }, 2 * 60 * 1000);
  }

  static stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  static async syncPendingData(): Promise<SyncStats> {
    if (this.isRunning || !NetworkService.isOnline()) {
      return { totalPending: 0, synced: 0, failed: 0 };
    }

    this.isRunning = true;
    const stats: SyncStats = { totalPending: 0, synced: 0, failed: 0 };

    try {
      const pendingItems = await OfflineStorageService.getPendingSync();
      stats.totalPending = pendingItems.length;

      if (pendingItems.length === 0) {
        this.isRunning = false;
        return stats;
      }

      console.log(`Starting sync of ${pendingItems.length} items`);

      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          await OfflineStorageService.updateSyncStatus(item.id, 'synced');
          stats.synced++;
        } catch (error) {
          console.error('Sync failed for item:', item.id, error);
          await OfflineStorageService.updateSyncStatus(
            item.id, 
            'failed', 
            error instanceof Error ? error.message : 'Unknown error'
          );
          stats.failed++;
        }
      }

      // Notify listeners
      this.notifyListeners(stats);

    } catch (error) {
      console.error('Sync process error:', error);
    } finally {
      this.isRunning = false;
    }

    return stats;
  }

  private static async syncItem(item: OfflineData): Promise<void> {
    // Simulate API call (replace with actual API calls)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          console.log(`✅ Synced ${item.type} ${item.id} for farm ${item.farmName}`);
          resolve();
        } else {
          reject(new Error('Network timeout'));
        }
      }, 500 + Math.random() * 1000);
    });
  }

  static async forceSyncNow(): Promise<SyncStats> {
    if (!NetworkService.isOnline()) {
      throw new Error('No internet connection');
    }

    return this.syncPendingData();
  }

  static addListener(callback: (stats: SyncStats) => void): void {
    this.listeners.push(callback);
  }

  static removeListener(callback: (stats: SyncStats) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private static notifyListeners(stats: SyncStats): void {
    this.listeners.forEach(listener => listener(stats));
  }

  static async getStorageStats() {
    return OfflineStorageService.getStats();
  }
}