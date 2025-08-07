import { OfflineStorageService, OfflineDrawing } from './offlineStorageService';
import { UnitService } from './unitService';

export interface DrawingPoint {
  x: number;
  y: number;
  lat?: number;
  lng?: number;
}

export interface DrawingShape {
  id: string;
  farmId: string;
  farmName: string;
  fieldName?: string;
  shapeType: 'freehand' | 'polygon' | 'pivot' | 'rectangle';
  points: DrawingPoint[];
  timestamp: Date;
  isSelected?: boolean;
  color?: string;
  areaM2?: number;
  areaHa?: number;
  areaFormatted?: string[];
}

export class DrawingService {
  private static shapes: DrawingShape[] = [];
  private static selectedShape: DrawingShape | null = null;
  private static listeners: ((shapes: DrawingShape[]) => void)[] = [];

  static async saveDrawing(shape: DrawingShape): Promise<void> {
    // Calculate area before saving
    const area = this.calculateArea(shape.points);
    shape.areaM2 = area;
    shape.areaHa = Math.round(area / 10000 * 100) / 100; // Convert to hectares with 2 decimals
    shape.areaFormatted = UnitService.getMultipleFormats(area);

    const offlineDrawing: OfflineDrawing = {
      id: shape.id,
      type: 'drawing',
      farmId: shape.farmId,
      farmName: shape.farmName,
      fieldName: shape.fieldName,
      timestamp: shape.timestamp,
      syncStatus: 'pending',
      shapeType: shape.shapeType,
      coordinates: shape.points,
      areaM2: shape.areaM2,
      areaHa: shape.areaHa
    };

    await OfflineStorageService.save(offlineDrawing);
    
    // Add to local cache
    this.shapes.push(shape);
    this.notifyListeners();
  }

  static async updateDrawing(id: string, newPoints: DrawingPoint[]): Promise<void> {
    // Update in offline storage
    const stored = await OfflineStorageService.getById(id);
    if (stored && stored.type === 'drawing') {
      stored.coordinates = newPoints;
      stored.syncStatus = 'pending';
      stored.lastSyncAttempt = new Date();
      await OfflineStorageService.save(stored);
    }

    // Update local cache
    const shapeIndex = this.shapes.findIndex(s => s.id === id);
    if (shapeIndex !== -1) {
      this.shapes[shapeIndex].points = newPoints;
      this.notifyListeners();
    }
  }

  static async deleteDrawing(id: string): Promise<void> {
    // Mark as deleted in offline storage
    await OfflineStorageService.markAsDeleted(id);

    // Remove from local cache
    this.shapes = this.shapes.filter(s => s.id !== id);
    
    if (this.selectedShape?.id === id) {
      this.selectedShape = null;
    }
    
    this.notifyListeners();
  }

  static async loadDrawings(): Promise<DrawingShape[]> {
    try {
      const offlineDrawings = await OfflineStorageService.getByType<OfflineDrawing>('drawing');
      this.shapes = offlineDrawings
        .filter(drawing => !drawing.isDeleted) // Don't show deleted items
        .map(drawing => ({
          id: drawing.id,
          farmId: drawing.farmId,
          farmName: drawing.farmName,
          fieldName: drawing.fieldName,
          shapeType: drawing.shapeType as any,
          points: drawing.coordinates as DrawingPoint[],
          timestamp: drawing.timestamp,
          color: this.getShapeColor(drawing.shapeType),
          areaM2: drawing.areaM2,
          areaHa: drawing.areaHa,
          areaFormatted: drawing.areaM2 ? UnitService.getMultipleFormats(drawing.areaM2) : undefined
        }));
      
      return this.shapes;
    } catch (error) {
      console.error('Error loading drawings:', error);
      return [];
    }
  }

  static getDrawingsByFarm(farmId: string): DrawingShape[] {
    return this.shapes.filter(shape => shape.farmId === farmId);
  }

  static selectShape(id: string): DrawingShape | null {
    // Deselect current
    if (this.selectedShape) {
      this.selectedShape.isSelected = false;
    }

    // Select new
    const shape = this.shapes.find(s => s.id === id);
    if (shape) {
      shape.isSelected = true;
      this.selectedShape = shape;
    } else {
      this.selectedShape = null;
    }

    this.notifyListeners();
    return this.selectedShape;
  }

  static deselectShape(): void {
    if (this.selectedShape) {
      this.selectedShape.isSelected = false;
      this.selectedShape = null;
    }
    this.notifyListeners();
  }

  static getSelectedShape(): DrawingShape | null {
    return this.selectedShape;
  }

  static getAllShapes(): DrawingShape[] {
    return this.shapes;
  }

  static canEdit(shape: DrawingShape, userFarmId: string, isConsultor: boolean, selectedProducerId?: string): boolean {
    if (isConsultor) {
      return selectedProducerId === shape.farmId;
    } else {
      return userFarmId === shape.farmId;
    }
  }

  private static getShapeColor(shapeType: string): string {
    const colors = {
      freehand: '#3b82f6',
      polygon: '#10b981',
      pivot: '#f59e0b',
      rectangle: '#ef4444'
    };
    return colors[shapeType as keyof typeof colors] || '#6b7280';
  }

  static addListener(callback: (shapes: DrawingShape[]) => void): void {
    this.listeners.push(callback);
  }

  static removeListener(callback: (shapes: DrawingShape[]) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.shapes]));
  }

  private static calculateArea(points: DrawingPoint[]): number {
    if (points.length < 3) return 0;

    // Use Shoelace formula for geographic coordinates
    // Convert to projected coordinates for accurate area calculation
    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const lat1 = points[i].lat || 0;
      const lng1 = points[i].lng || 0;
      const lat2 = points[j].lat || 0;
      const lng2 = points[j].lng || 0;

      // Convert to radians
      const lat1Rad = lat1 * Math.PI / 180;
      const lat2Rad = lat2 * Math.PI / 180;
      const deltaLng = (lng2 - lng1) * Math.PI / 180;

      // Use spherical excess formula for accurate area on sphere
      const E = 2 * Math.atan2(Math.tan(deltaLng / 2) * (Math.tan(lat1Rad / 2) + Math.tan(lat2Rad / 2)), 
                               2 + Math.tan(lat1Rad / 2) * Math.tan(lat2Rad / 2));
      area += E;
    }

    // Convert to square meters (Earth's radius ≈ 6,371,000 m)
    const earthRadius = 6371000;
    return Math.abs(area) * earthRadius * earthRadius;
  }
}