import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

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

  static savePhoto(photo: FieldPhoto): void {
    // Get existing photos from localStorage
    const existingPhotos = this.getStoredPhotos();
    
    // Add new photo
    const updatedPhotos = [...existingPhotos, photo];
    
    // Save to localStorage
    localStorage.setItem('fieldPhotos', JSON.stringify(updatedPhotos));
  }

  static getStoredPhotos(): FieldPhoto[] {
    try {
      const stored = localStorage.getItem('fieldPhotos');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading stored photos:', error);
      return [];
    }
  }

  static getPhotosByFarm(farmId: string): FieldPhoto[] {
    const allPhotos = this.getStoredPhotos();
    return allPhotos.filter(photo => photo.farmId === farmId);
  }
}