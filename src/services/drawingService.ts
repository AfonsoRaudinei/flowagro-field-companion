import { OfflineStorageService, OfflineDrawing } from './offlineStorageService';

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
}

export class DrawingService {
  private static shapes: DrawingShape[] = [];
  private static selectedShape: DrawingShape | null = null;
  private static listeners: ((shapes: DrawingShape[]) => void)[] = [];

  static async saveDrawing(shape: DrawingShape): Promise<void> {
    const offlineDrawing: OfflineDrawing = {
      id: shape.id,
      type: 'drawing',
      farmId: shape.farmId,
      farmName: shape.farmName,
      fieldName: shape.fieldName,
      timestamp: shape.timestamp,
      syncStatus: 'pending',
      shapeType: shape.shapeType,
      coordinates: shape.points
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
          color: this.getShapeColor(drawing.shapeType)
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
}