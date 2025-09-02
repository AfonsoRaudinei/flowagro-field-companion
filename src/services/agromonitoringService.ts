import { supabase } from '@/integrations/supabase/client';

export interface Polygon {
  id?: string;
  name: string;
  geo_json: {
    type: "Feature";
    properties: Record<string, any>;
    geometry: {
      type: "Polygon";
      coordinates: number[][][];
    };
  };
}

export interface NDVIData {
  dt: number;
  source: string;
  zoom: number;
  dc: number;
  cl: number;
  data: {
    truecolor: string;
    falsecolor: string;
    ndvi: string;
    evi: string;
  };
  stats: {
    ndvi: number;
    evi: number;
  };
}

export class AgroMonitoringService {
  
  /**
   * Create a new polygon for monitoring
   */
  static async createPolygon(polygon: Polygon): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('Creating polygon:', polygon.name);
      
      const { data, error } = await supabase.functions.invoke('agromonitoring-api', {
        body: { polygon },
        method: 'POST'
      });

      if (error) {
        console.error('Error creating polygon:', error);
        return { success: false, error: error.message };
      }

      console.log('Polygon created successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to create polygon:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * List all polygons
   */
  static async listPolygons(): Promise<{ success: boolean; polygons?: any[]; error?: string }> {
    try {
      console.log('Fetching polygons list...');
      
      const { data, error } = await supabase.functions.invoke('agromonitoring-api', {
        body: { action: 'list' },
        method: 'POST'
      });

      if (error) {
        console.error('Error fetching polygons:', error);
        return { success: false, error: error.message };
      }

      console.log(`Retrieved ${data?.polygons?.length || 0} polygons`);
      return { success: true, polygons: data.polygons || [] };
    } catch (error) {
      console.error('Failed to fetch polygons:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Delete a polygon
   */
  static async deletePolygon(polygonId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Deleting polygon:', polygonId);
      
      const { data, error } = await supabase.functions.invoke('agromonitoring-api', {
        body: { action: 'delete', polygon_id: polygonId },
        method: 'POST'
      });

      if (error) {
        console.error('Error deleting polygon:', error);
        return { success: false, error: error.message };
      }

      console.log('Polygon deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to delete polygon:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get NDVI data for a polygon
   */
  static async getNDVIData(
    polygonId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<{ success: boolean; data?: NDVIData[]; error?: string }> {
    try {
      console.log('Fetching NDVI data for polygon:', polygonId);
      
      const start = startDate ? Math.floor(startDate.getTime() / 1000) : 
        Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000); // 30 days ago
      const end = endDate ? Math.floor(endDate.getTime() / 1000) : 
        Math.floor(Date.now() / 1000); // now

      const { data, error } = await supabase.functions.invoke('agromonitoring-api', {
        body: { 
          action: 'ndvi', 
          polygon_id: polygonId,
          start: start.toString(),
          end: end.toString()
        },
        method: 'POST'
      });

      if (error) {
        console.error('Error fetching NDVI data:', error);
        return { success: false, error: error.message };
      }

      console.log('NDVI data retrieved successfully');
      return { success: true, data: data.data || [] };
    } catch (error) {
      console.error('Failed to fetch NDVI data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Convert drawn coordinates to AgroMonitoring polygon format
   */
  static coordinatesToPolygon(coordinates: number[][], name: string): Polygon {
    // Ensure the polygon is closed (first and last points are the same)
    const closedCoordinates = [...coordinates];
    if (
      closedCoordinates[0][0] !== closedCoordinates[closedCoordinates.length - 1][0] ||
      closedCoordinates[0][1] !== closedCoordinates[closedCoordinates.length - 1][1]
    ) {
      closedCoordinates.push(closedCoordinates[0]);
    }

    return {
      name,
      geo_json: {
        type: "Feature",
        properties: {
          name,
          created_at: new Date().toISOString()
        },
        geometry: {
          type: "Polygon",
          coordinates: [closedCoordinates]
        }
      }
    };
  }

  /**
   * Calculate area of a polygon in hectares
   */
  static calculateArea(coordinates: number[][]): number {
    // Simple area calculation using shoelace formula
    let area = 0;
    const n = coordinates.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coordinates[i][0] * coordinates[j][1];
      area -= coordinates[j][0] * coordinates[i][1];
    }
    
    area = Math.abs(area) / 2;
    
    // Convert from square degrees to approximate hectares
    // This is a rough approximation - for accurate area calculation,
    // proper geodesic calculations should be used
    const hectares = area * 111.32 * 111.32 / 10000; // Rough conversion
    
    return hectares;
  }
}