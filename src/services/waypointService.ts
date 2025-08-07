import { CameraService, FieldPhoto } from './cameraService';
import { TrailService, Trail } from './trailService';
import { GPSService } from './gpsService';

export interface Waypoint {
  id: string;
  trailId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  type: 'photo' | 'marker' | 'note';
  title: string;
  description?: string;
  photoId?: string;
  pointIndex: number; // Index of the trail point closest to this waypoint
}

export class WaypointService {
  /**
   * Create a waypoint with photo during active trail recording
   */
  static async createPhotoWaypoint(
    title: string,
    description?: string
  ): Promise<Waypoint | null> {
    try {
      const currentTrail = TrailService.getCurrentTrail();
      if (!currentTrail || !currentTrail.isActive) {
        throw new Error('Nenhuma trilha ativa para adicionar waypoint');
      }

      // Take photo
      const photo = await CameraService.takePhoto();
      if (!photo) {
        throw new Error('Falha ao capturar foto');
      }

      // Get current location
      const location = await GPSService.getCurrentLocation();

      // Find closest trail point
      const pointIndex = this.findClosestTrailPoint(
        currentTrail,
        location.latitude,
        location.longitude
      );

      // Create photo record
      const fieldPhoto: FieldPhoto = {
        id: `waypoint-photo-${Date.now()}`,
        farmId: currentTrail.farmId,
        farmName: currentTrail.farmName,
        eventType: 'outro',
        eventLabel: title,
        imagePath: photo,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date(),
        severity: 'medio',
        notes: `${description || ''} | Waypoint da trilha ${currentTrail.id}`
      };

      await CameraService.savePhoto(fieldPhoto);

      // Create waypoint
      const waypoint: Waypoint = {
        id: `waypoint-${Date.now()}`,
        trailId: currentTrail.id,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date(),
        type: 'photo',
        title,
        description,
        photoId: fieldPhoto.id,
        pointIndex
      };

      return waypoint;
    } catch (error) {
      console.error('Error creating photo waypoint:', error);
      throw error;
    }
  }

  /**
   * Create a simple marker waypoint during active trail recording
   */
  static async createMarkerWaypoint(
    title: string,
    description?: string
  ): Promise<Waypoint | null> {
    try {
      const currentTrail = TrailService.getCurrentTrail();
      if (!currentTrail || !currentTrail.isActive) {
        throw new Error('Nenhuma trilha ativa para adicionar waypoint');
      }

      // Get current location
      const location = await GPSService.getCurrentLocation();

      // Find closest trail point
      const pointIndex = this.findClosestTrailPoint(
        currentTrail,
        location.latitude,
        location.longitude
      );

      // Create waypoint
      const waypoint: Waypoint = {
        id: `waypoint-${Date.now()}`,
        trailId: currentTrail.id,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date(),
        type: 'marker',
        title,
        description,
        pointIndex
      };

      return waypoint;
    } catch (error) {
      console.error('Error creating marker waypoint:', error);
      throw error;
    }
  }

  /**
   * Find the trail point closest to given coordinates
   */
  private static findClosestTrailPoint(
    trail: Trail,
    latitude: number,
    longitude: number
  ): number {
    if (trail.points.length === 0) return 0;

    let closestIndex = 0;
    let minDistance = Number.MAX_VALUE;

    trail.points.forEach((point, index) => {
      const distance = GPSService.calculateDistance(
        latitude,
        longitude,
        point.latitude,
        point.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  /**
   * Get all waypoints for a specific trail
   */
  static async getWaypointsForTrail(trailId: string): Promise<Waypoint[]> {
    try {
      // For now, we'll reconstruct waypoints from photos that mention the trail ID
      const allPhotos = await CameraService.getStoredPhotos();
      
      const trailPhotos = allPhotos.filter(photo => 
        photo.notes?.includes(`trilha ${trailId}`) || 
        photo.notes?.includes(`rota ${trailId}`)
      );

      const waypoints: Waypoint[] = trailPhotos.map(photo => ({
        id: `waypoint-${photo.id}`,
        trailId,
        latitude: photo.latitude || 0,
        longitude: photo.longitude || 0,
        timestamp: photo.timestamp,
        type: 'photo' as const,
        title: photo.eventLabel,
        description: photo.notes,
        photoId: photo.id,
        pointIndex: 0 // We don't have this info for existing photos
      }));

      return waypoints.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error getting waypoints for trail:', error);
      return [];
    }
  }

  /**
   * Get waypoints for a farm across all trails
   */
  static async getWaypointsByFarm(farmId: string): Promise<Waypoint[]> {
    try {
      const farmPhotos = await CameraService.getPhotosByFarm(farmId);
      
      // Filter photos that are waypoints (contain trail/rota references)
      const waypointPhotos = farmPhotos.filter(photo => 
        photo.notes?.includes('trilha ') || 
        photo.notes?.includes('rota ')
      );

      const waypoints: Waypoint[] = waypointPhotos.map(photo => {
        // Try to extract trail ID from notes
        const trailMatch = photo.notes?.match(/(trilha|rota) ([^\s|]+)/);
        const trailId = trailMatch ? trailMatch[2] : 'unknown';

        return {
          id: `waypoint-${photo.id}`,
          trailId,
          latitude: photo.latitude || 0,
          longitude: photo.longitude || 0,
          timestamp: photo.timestamp,
          type: 'photo' as const,
          title: photo.eventLabel,
          description: photo.notes,
          photoId: photo.id,
          pointIndex: 0
        };
      });

      return waypoints.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error getting waypoints by farm:', error);
      return [];
    }
  }

  /**
   * Format waypoint for display
   */
  static formatWaypoint(waypoint: Waypoint): string {
    const time = new Date(waypoint.timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const coords = `${waypoint.latitude.toFixed(6)}, ${waypoint.longitude.toFixed(6)}`;
    
    let formatted = `📍 ${waypoint.title} - ${time}`;
    
    if (waypoint.description) {
      formatted += ` - ${waypoint.description}`;
    }
    
    formatted += ` - ${coords}`;
    
    return formatted;
  }
}