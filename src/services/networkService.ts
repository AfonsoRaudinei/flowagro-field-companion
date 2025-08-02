import { Network } from '@capacitor/network';

export interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}

export class NetworkService {
  private static listeners: ((status: NetworkStatus) => void)[] = [];
  private static currentStatus: NetworkStatus = { connected: true, connectionType: 'unknown' };

  static async initialize(): Promise<void> {
    try {
      // Get initial status
      const status = await Network.getStatus();
      this.currentStatus = {
        connected: status.connected,
        connectionType: status.connectionType
      };

      // Listen for changes
      Network.addListener('networkStatusChange', (status) => {
        this.currentStatus = {
          connected: status.connected,
          connectionType: status.connectionType
        };
        this.notifyListeners();
      });

    } catch (error) {
      console.warn('Network service not available, assuming online:', error);
      this.currentStatus = { connected: true, connectionType: 'wifi' };
    }
  }

  static isOnline(): boolean {
    return this.currentStatus.connected;
  }

  static getStatus(): NetworkStatus {
    return this.currentStatus;
  }

  static addListener(callback: (status: NetworkStatus) => void): void {
    this.listeners.push(callback);
  }

  static removeListener(callback: (status: NetworkStatus) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentStatus));
  }
}