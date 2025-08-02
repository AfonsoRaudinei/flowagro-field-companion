import { GPSService, UserLocation } from './gpsService';
import { OfflineStorageService, OfflineTrail } from './offlineStorageService';

export interface TrailPoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy: number;
}

export interface Trail {
  id: string;
  farmId: string;
  farmName: string;
  points: TrailPoint[];
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  totalDistance?: number; // in meters
}

export class TrailService {
  private static watchId: string | null = null;
  private static currentTrail: Trail | null = null;
  private static updateCallback: ((trail: Trail) => void) | null = null;

  static async startTrailRecording(
    farmId: string, 
    farmName: string,
    onUpdate: (trail: Trail) => void
  ): Promise<Trail> {
    try {
      // Check if there's already an active trail
      if (this.currentTrail?.isActive) {
        throw new Error('Já existe uma trilha ativa. Pare a gravação atual primeiro.');
      }

      // Create new trail
      const trail: Trail = {
        id: `trail-${Date.now()}`,
        farmId,
        farmName,
        points: [],
        startTime: new Date(),
        isActive: true
      };

      this.currentTrail = trail;
      this.updateCallback = onUpdate;

      // Get initial position
      const initialLocation = await GPSService.getCurrentLocation();
      this.addPointToTrail({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        timestamp: new Date(),
        accuracy: initialLocation.accuracy
      });

      // Start watching position
      this.watchId = await GPSService.watchPosition((location) => {
        this.addPointToTrail({
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date(),
          accuracy: location.accuracy
        });
      });

      return trail;
    } catch (error) {
      console.error('Error starting trail recording:', error);
      throw new Error('Erro ao iniciar gravação da trilha');
    }
  }

  static async stopTrailRecording(): Promise<Trail | null> {
    try {
      if (!this.currentTrail || !this.currentTrail.isActive) {
        throw new Error('Nenhuma trilha ativa para parar');
      }

      // Stop watching position
      if (this.watchId) {
        await GPSService.clearWatch(this.watchId);
        this.watchId = null;
      }

      // Update trail
      this.currentTrail.isActive = false;
      this.currentTrail.endTime = new Date();
      this.currentTrail.totalDistance = this.calculateTrailDistance(this.currentTrail.points);

      // Save to storage
      this.saveTrail(this.currentTrail);

      const completedTrail = { ...this.currentTrail };
      this.currentTrail = null;
      this.updateCallback = null;

      return completedTrail;
    } catch (error) {
      console.error('Error stopping trail recording:', error);
      throw new Error('Erro ao parar gravação da trilha');
    }
  }

  private static addPointToTrail(point: TrailPoint): void {
    if (!this.currentTrail || !this.currentTrail.isActive) return;

    // Add point if it's different enough from the last one (avoid duplicate points)
    const lastPoint = this.currentTrail.points[this.currentTrail.points.length - 1];
    if (lastPoint) {
      const distance = GPSService.calculateDistance(
        lastPoint.latitude,
        lastPoint.longitude,
        point.latitude,
        point.longitude
      );
      
      // Only add point if it's more than 2 meters from the last one
      if (distance < 2) return;
    }

    this.currentTrail.points.push(point);

    // Update distance
    this.currentTrail.totalDistance = this.calculateTrailDistance(this.currentTrail.points);

    // Notify callback
    if (this.updateCallback) {
      this.updateCallback({ ...this.currentTrail });
    }
  }

  private static calculateTrailDistance(points: TrailPoint[]): number {
    if (points.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      totalDistance += GPSService.calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );
    }

    return totalDistance;
  }

  static async saveTrail(trail: Trail): Promise<void> {
    const offlineTrail: OfflineTrail = {
      id: trail.id,
      type: 'trail',
      farmId: trail.farmId,
      farmName: trail.farmName,
      timestamp: trail.endTime || trail.startTime,
      syncStatus: 'pending',
      points: trail.points,
      startTime: trail.startTime,
      endTime: trail.endTime!,
      totalDistance: trail.totalDistance || 0
    };

    await OfflineStorageService.save(offlineTrail);
  }

  static async getStoredTrails(): Promise<Trail[]> {
    try {
      const offlineTrails = await OfflineStorageService.getByType<OfflineTrail>('trail');
      return offlineTrails.map(trail => ({
        id: trail.id,
        farmId: trail.farmId,
        farmName: trail.farmName,
        points: trail.points,
        startTime: trail.startTime,
        endTime: trail.endTime,
        isActive: false, // Stored trails are never active
        totalDistance: trail.totalDistance
      }));
    } catch (error) {
      console.error('Error reading stored trails:', error);
      return [];
    }
  }

  static async getTrailsByFarm(farmId: string): Promise<Trail[]> {
    try {
      const farmData = await OfflineStorageService.getByFarmId(farmId);
      const trails = farmData.filter(item => item.type === 'trail') as OfflineTrail[];
      return trails.map(trail => ({
        id: trail.id,
        farmId: trail.farmId,
        farmName: trail.farmName,
        points: trail.points,
        startTime: trail.startTime,
        endTime: trail.endTime,
        isActive: false,
        totalDistance: trail.totalDistance
      }));
    } catch (error) {
      console.error('Error reading trails by farm:', error);
      return [];
    }
  }

  static getCurrentTrail(): Trail | null {
    return this.currentTrail;
  }

  static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(2)}km`;
    }
  }

  static formatDuration(startTime: Date, endTime?: Date): string {
    const end = endTime || new Date();
    const duration = Math.floor((end.getTime() - startTime.getTime()) / 1000);
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
}