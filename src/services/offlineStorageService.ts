export type SyncStatus = 'pending' | 'synced' | 'failed' | 'deleted-pending-sync';

export interface BaseOfflineData {
  id: string;
  farmId: string;
  farmName: string;
  timestamp: Date;
  syncStatus: SyncStatus;
  lastSyncAttempt?: Date;
  syncError?: string;
  isDeleted?: boolean;
}

export interface OfflinePhoto extends BaseOfflineData {
  type: 'photo';
  eventType: string;
  eventLabel: string;
  imagePath: string;
  latitude?: number;
  longitude?: number;
}

export interface OfflineTrail extends BaseOfflineData {
  type: 'trail';
  points: Array<{
    latitude: number;
    longitude: number;
    timestamp: Date;
    accuracy: number;
  }>;
  startTime: Date;
  endTime: Date;
  totalDistance: number;
}

export interface OfflineDrawing extends BaseOfflineData {
  type: 'drawing';
  shapeType: string;
  fieldName?: string;
  coordinates: any[];
  areaM2?: number;
  areaHa?: number;
}

export interface OfflineImport extends BaseOfflineData {
  type: 'import';
  fileName: string;
  fileType: '.kml' | '.kmz';
  fileContent: string;
  boundingBox?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export type OfflineData = OfflinePhoto | OfflineTrail | OfflineDrawing | OfflineImport;

export class OfflineStorageService {
  private static DB_NAME = 'FlowAgroOfflineDB';
  private static DB_VERSION = 1;
  private static STORE_NAME = 'offlineData';

  static async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('farmId', 'farmId', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
        }
      };
    });
  }

  private static async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  static async save(data: OfflineData): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const request = store.put(data);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  static async getById(id: string): Promise<OfflineData | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  static async getByFarmId(farmId: string): Promise<OfflineData[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('farmId');
      
      const request = index.getAll(farmId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  static async getByType<T extends OfflineData>(type: T['type']): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('type');
      
      const request = index.getAll(type);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  static async getPendingSync(): Promise<OfflineData[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('syncStatus');
      
      const request = index.getAll('pending');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  static async updateSyncStatus(id: string, status: SyncStatus, error?: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      // First get the item
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.syncStatus = status;
          data.lastSyncAttempt = new Date();
          if (error) data.syncError = error;
          
          const putRequest = store.put(data);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          reject(new Error('Item not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  static async delete(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  static async markAsDeleted(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      // First get the item
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.isDeleted = true;
          data.syncStatus = 'deleted-pending-sync';
          data.lastSyncAttempt = new Date();
          
          const putRequest = store.put(data);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          reject(new Error('Item not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  static async getStats(): Promise<{ total: number; pending: number; synced: number; failed: number }> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const stats = { total: 0, pending: 0, synced: 0, failed: 0 };
      
      const request = store.openCursor();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          stats.total++;
          stats[cursor.value.syncStatus as keyof typeof stats]++;
          cursor.continue();
        } else {
          resolve(stats);
        }
      };
    });
  }
}