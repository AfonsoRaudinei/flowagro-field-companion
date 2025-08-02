import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { OfflineStorageService, OfflinePhoto } from './offlineStorageService';

export interface FieldPhoto {
  id: string;
  farmId: string;
  farmName: string;
  eventType: 'pest' | 'disease' | 'poor-stand' | 'nutrient-deficiency';
  eventLabel: string;
  imagePath: string;
  latitude?: number;
  longitude?: number;
  timestamp: Date;
}

export const eventTypes = [
  { id: 'pest', name: 'Praga', color: 'bg-red-500', emoji: '🐛' },
  { id: 'disease', name: 'Doença', color: 'bg-orange-500', emoji: '🦠' },
  { id: 'poor-stand', name: 'Stand ruim', color: 'bg-yellow-500', emoji: '🌱' },
  { id: 'nutrient-deficiency', name: 'Deficiência nutricional', color: 'bg-purple-500', emoji: '🧪' }
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
      longitude: photo.longitude
    };

    await OfflineStorageService.save(offlinePhoto);
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
        timestamp: photo.timestamp
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
        timestamp: photo.timestamp
      }));
    } catch (error) {
      console.error('Error reading photos by farm:', error);
      return [];
    }
  }
}