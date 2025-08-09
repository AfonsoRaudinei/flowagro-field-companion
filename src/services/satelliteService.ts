import { supabase } from '@/integrations/supabase/client';

export interface SatelliteImageRequest {
  bbox: [number, number, number, number]; // [min_lng, min_lat, max_lng, max_lat]
  date: Date;
  layerType: 'ndvi' | 'true-color' | 'false-color' | 'visual' | 'analytic';
  source: 'sentinel' | 'planet';
  width?: number;
  height?: number;
}

export interface SatelliteImageResponse {
  imageUrl?: string;
  imageData?: ArrayBuffer;
  metadata: {
    date: string;
    cloudCover?: number;
    resolution?: string;
    source: string;
    layerType: string;
  };
  status: 'success' | 'error' | 'activating';
  error?: string;
}

class SatelliteService {
  private cache = new Map<string, SatelliteImageResponse>();

  private getCacheKey(request: SatelliteImageRequest): string {
    return `${request.source}-${request.layerType}-${request.date.toISOString().split('T')[0]}-${request.bbox.join(',')}`;
  }

  async getSentinelImage(request: SatelliteImageRequest): Promise<SatelliteImageResponse> {
    const cacheKey = this.getCacheKey(request);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const { data, error } = await supabase.functions.invoke<ArrayBuffer>('sentinel-hub', {
        body: {
          bbox: request.bbox,
          date: request.date.toISOString().split('T')[0],
          layerType: request.layerType,
          width: request.width || 512,
          height: request.height || 512
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const response: SatelliteImageResponse = {
        imageData: data,
        metadata: {
          date: request.date.toISOString().split('T')[0],
          source: 'Sentinel-2',
          layerType: request.layerType,
          resolution: '10m'
        },
        status: 'success'
      };

      // Cache the response
      this.cache.set(cacheKey, response);
      
      return response;
    } catch (error) {
      console.error('Sentinel Hub error:', error);
      return {
        metadata: {
          date: request.date.toISOString().split('T')[0],
          source: 'Sentinel-2',
          layerType: request.layerType
        },
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getPlanetImage(request: SatelliteImageRequest): Promise<SatelliteImageResponse> {
    const cacheKey = this.getCacheKey(request);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      type PlanetInvokeResult = {
        acquisitionDate: string;
        cloudCover: number;
        status: 'activating' | 'ready' | string;
        downloadUrl: string;
      };
      const { data, error } = await supabase.functions.invoke<PlanetInvokeResult>('planet-labs', {
        body: {
          bbox: request.bbox,
          date: request.date.toISOString().split('T')[0],
          layerType: request.layerType,
          cloudCover: 0.3
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const response: SatelliteImageResponse = {
        metadata: {
          date: data.acquisitionDate,
          cloudCover: data.cloudCover,
          source: 'Planet Labs',
          layerType: request.layerType,
          resolution: '3m'
        },
        status: data.status === 'activating' ? 'activating' : 'success',
        imageUrl: data.downloadUrl
      };

      // Cache successful responses
      if (response.status === 'success') {
        this.cache.set(cacheKey, response);
      }
      
      return response;
    } catch (error) {
      console.error('Planet Labs error:', error);
      return {
        metadata: {
          date: request.date.toISOString().split('T')[0],
          source: 'Planet Labs',
          layerType: request.layerType
        },
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getSatelliteImage(request: SatelliteImageRequest): Promise<SatelliteImageResponse> {
    if (request.source === 'sentinel') {
      return this.getSentinelImage(request);
    } else if (request.source === 'planet') {
      return this.getPlanetImage(request);
    } else {
      throw new Error(`Unsupported satellite source: ${request.source}`);
    }
  }

  // Calculate NDVI overlay for MapLibre
  createNDVILayer(imageResponse: SatelliteImageResponse, bbox: [number, number, number, number]) {
    if (imageResponse.status !== 'success' || !imageResponse.imageData) {
      return null;
    }

    // Convert image data to base64 for MapLibre
    const base64Image = this.arrayBufferToBase64(imageResponse.imageData);
    
    return {
      id: `ndvi-${Date.now()}`,
      type: 'raster' as const,
      source: {
        type: 'image' as const,
        url: `data:image/png;base64,${base64Image}`,
        coordinates: [
          [bbox[0], bbox[3]], // top-left
          [bbox[2], bbox[3]], // top-right
          [bbox[2], bbox[1]], // bottom-right
          [bbox[0], bbox[1]]  // bottom-left
        ] as [[number, number], [number, number], [number, number], [number, number]]
      },
      paint: {
        'raster-opacity': 0.7,
        'raster-fade-duration': 300
      }
    };
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Clear cache (useful for memory management)
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache size for monitoring
  getCacheSize(): number {
    return this.cache.size;
  }
}

export const satelliteService = new SatelliteService();