import { Geolocation, Position } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

export class GPSService {
  static async requestPermissions(): Promise<boolean> {
    try {
      const permissions = await Geolocation.requestPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Error requesting GPS permissions:', error);
      return false;
    }
  }

  static async checkPermissions(): Promise<boolean> {
    try {
      const permissions = await Geolocation.checkPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Error checking GPS permissions:', error);
      return false;
    }
  }

  static async getCurrentLocation(): Promise<UserLocation> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      });

      // Trigger haptic feedback on successful location
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (hapticError) {
        // Haptics might not be available on all devices
        console.warn('Haptics not available:', hapticError);
      }

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw new Error('Erro ao obter localização');
    }
  }

  static async watchPosition(callback: (location: UserLocation) => void): Promise<string> {
    try {
      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 60000
        },
        (position: Position | null, error?: any) => {
          if (error) {
            console.error('Watch position error:', error);
            return;
          }

          if (position) {
            const location: UserLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date()
            };
            callback(location);
          }
        }
      );

      return watchId;
    } catch (error) {
      console.error('Error watching position:', error);
      throw new Error('Erro ao monitorar localização');
    }
  }

  static async clearWatch(watchId: string): Promise<void> {
    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch (error) {
      console.error('Error clearing watch:', error);
    }
  }

  static formatCoordinates(lat: number, lng: number): string {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    
    return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lng).toFixed(6)}°${lngDir}`;
  }

  static calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Return distance in meters
  }
}