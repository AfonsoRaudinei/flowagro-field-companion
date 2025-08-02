import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { OfflineStorageService, OfflinePhoto } from './offlineStorageService';

export interface FieldPhoto {
  id: string;
  farmId: string;
  farmName: string;
  eventType: 'sugador' | 'mastigador' | 'doenca' | 'deficiencia' | 'populacao' | 'outro';
  eventLabel: string;
  imagePath: string;
  latitude?: number;
  longitude?: number;
  timestamp: Date;
  quantity?: number;
  severity: 'baixo' | 'medio' | 'alto';
  notes?: string;
}

export interface CheckInOut {
  id: string;
  farmId: string;
  farmName: string;
  type: 'checkin' | 'checkout';
  latitude: number;
  longitude: number;
  timestamp: Date;
}

export const eventTypes = [
  { id: 'sugador', name: 'Sugador', color: 'bg-red-500', emoji: '🐛' },
  { id: 'mastigador', name: 'Mastigador', color: 'bg-orange-500', emoji: '🦗' },
  { id: 'doenca', name: 'Doença', color: 'bg-purple-500', emoji: '🦠' },
  { id: 'deficiencia', name: 'Deficiência nutricional', color: 'bg-yellow-500', emoji: '🧪' },
  { id: 'populacao', name: 'Conferência de população', color: 'bg-blue-500', emoji: '📊' },
  { id: 'outro', name: 'Outro', color: 'bg-gray-500', emoji: '📝' }
];

export class CameraService {
  static async takePhoto(): Promise<string> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      return image.dataUrl || '';
    } catch (error) {
      console.error('Error taking photo:', error);
      throw new Error('Erro ao acessar a câmera');
    }
  }

  static async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      return {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
      };
    } catch (error) {
      console.warn('Error getting location:', error);
      return null;
    }
  }

  static async savePhoto(photo: FieldPhoto): Promise<void> {
    // Save to offline storage
    const offlinePhoto: OfflinePhoto = {
      id: photo.id,
      type: 'photo',
      farmId: photo.farmId,
      farmName: photo.farmName,
      timestamp: photo.timestamp,
      syncStatus: 'pending',
      eventType: photo.eventType,
      eventLabel: photo.eventLabel,
      imagePath: photo.imagePath,
      latitude: photo.latitude,
      longitude: photo.longitude,
      quantity: photo.quantity,
      severity: photo.severity,
      notes: photo.notes
    };

    await OfflineStorageService.save(offlinePhoto);
  }

  static async saveCheckInOut(checkInOut: CheckInOut): Promise<void> {
    // Save check-in/out event to offline storage with special type
    const offlineEvent = {
      id: checkInOut.id,
      type: 'checkinout' as const,
      farmId: checkInOut.farmId,
      farmName: checkInOut.farmName,
      timestamp: checkInOut.timestamp,
      syncStatus: 'pending' as const,
      eventType: checkInOut.type,
      latitude: checkInOut.latitude,
      longitude: checkInOut.longitude
    };

    await OfflineStorageService.save(offlineEvent);
  }

  static async getStoredPhotos(): Promise<FieldPhoto[]> {
    try {
      const offlinePhotos = await OfflineStorageService.getByType<OfflinePhoto>('photo');
      return offlinePhotos.map(photo => ({
        id: photo.id,
        farmId: photo.farmId,
        farmName: photo.farmName,
        eventType: photo.eventType as any,
        eventLabel: photo.eventLabel,
        imagePath: photo.imagePath,
        latitude: photo.latitude,
        longitude: photo.longitude,
        timestamp: photo.timestamp,
        quantity: photo.quantity,
        severity: (photo.severity || 'medio') as 'baixo' | 'medio' | 'alto',
        notes: photo.notes
      }));
    } catch (error) {
      console.error('Error reading stored photos:', error);
      return [];
    }
  }

  static async getPhotosByFarm(farmId: string): Promise<FieldPhoto[]> {
    try {
      const farmData = await OfflineStorageService.getByFarmId(farmId);
      const photos = farmData.filter(item => item.type === 'photo') as OfflinePhoto[];
      return photos.map(photo => ({
        id: photo.id,
        farmId: photo.farmId,
        farmName: photo.farmName,
        eventType: photo.eventType as any,
        eventLabel: photo.eventLabel,
        imagePath: photo.imagePath,
        latitude: photo.latitude,
        longitude: photo.longitude,
        timestamp: photo.timestamp,
        quantity: photo.quantity,
        severity: (photo.severity || 'medio') as 'baixo' | 'medio' | 'alto',
        notes: photo.notes
      }));
    } catch (error) {
      console.error('Error reading photos by farm:', error);
      return [];
    }
  }

  static async getLastCheckInOut(farmId: string): Promise<CheckInOut | null> {
    try {
      const farmData = await OfflineStorageService.getByFarmId(farmId);
      const checkEvents = farmData.filter(item => item.type === 'checkinout')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      if (checkEvents.length === 0) return null;
      
      const lastEvent = checkEvents[0] as any;
      return {
        id: lastEvent.id,
        farmId: lastEvent.farmId,
        farmName: lastEvent.farmName,
        type: lastEvent.eventType,
        latitude: lastEvent.latitude,
        longitude: lastEvent.longitude,
        timestamp: lastEvent.timestamp
      };
    } catch (error) {
      console.error('Error getting last check-in/out:', error);
      return null;
    }
  }

  static createChatMessage(photo: FieldPhoto): string {
    const time = new Date(photo.timestamp).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const coords = photo.latitude && photo.longitude 
      ? `Lat ${photo.latitude.toFixed(6)}, Lon ${photo.longitude.toFixed(6)}`
      : 'Localização não disponível';
    
    const emoji = eventTypes.find(e => e.id === photo.eventType)?.emoji || '📸';
    
    let message = `${emoji} Novo registro de campo: ${photo.eventLabel}`;
    
    if (photo.quantity && (photo.eventType === 'sugador' || photo.eventType === 'mastigador')) {
      message += ` — ${photo.quantity} insetos`;
    }
    
    message += ` — Severidade: ${photo.severity} — ${time} — ${coords}`;
    
    if (photo.notes) {
      message += ` — Obs: ${photo.notes}`;
    }
    
    return message;
  }
}