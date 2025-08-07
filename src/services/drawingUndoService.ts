import { DrawingPoint } from './drawingService';

export interface DrawingAction {
  id: string;
  type: 'ADD_POINT' | 'REMOVE_POINT' | 'CLOSE_POLYGON' | 'START_DRAWING' | 'CANCEL_DRAWING';
  timestamp: Date;
  data: {
    point?: DrawingPoint;
    index?: number;
    allPoints?: DrawingPoint[];
  };
}

export interface DrawingSession {
  id: string;
  farmId: string;
  farmName: string;
  fieldName?: string;
  shapeType: 'freehand' | 'polygon' | 'pivot' | 'rectangle';
  currentPoints: DrawingPoint[];
  actions: DrawingAction[];
  isCompleted: boolean;
  timestamp: Date;
}

export class DrawingUndoService {
  private static currentSession: DrawingSession | null = null;
  private static listeners: ((session: DrawingSession | null) => void)[] = [];

  static startSession(farmId: string, farmName: string, shapeType: string, fieldName?: string): DrawingSession {
    const session: DrawingSession = {
      id: `drawing_${Date.now()}`,
      farmId,
      farmName,
      fieldName,
      shapeType: shapeType as any,
      currentPoints: [],
      actions: [],
      isCompleted: false,
      timestamp: new Date()
    };

    this.currentSession = session;
    this.addAction('START_DRAWING', {});
    this.saveSessionToStorage();
    this.notifyListeners();

    return session;
  }

  static addPoint(point: DrawingPoint): boolean {
    if (!this.currentSession || this.currentSession.isCompleted) return false;

    this.currentSession.currentPoints.push(point);
    this.addAction('ADD_POINT', { point, index: this.currentSession.currentPoints.length - 1 });
    this.saveSessionToStorage();
    this.notifyListeners();

    return true;
  }

  static undoLastPoint(): DrawingPoint | null {
    if (!this.currentSession || this.currentSession.currentPoints.length === 0) return null;

    const removedPoint = this.currentSession.currentPoints.pop();
    if (removedPoint) {
      this.addAction('REMOVE_POINT', { 
        point: removedPoint, 
        index: this.currentSession.currentPoints.length 
      });
      this.saveSessionToStorage();
      this.notifyListeners();
    }

    return removedPoint || null;
  }

  static canUndo(): boolean {
    return this.currentSession !== null && this.currentSession.currentPoints.length > 0;
  }

  static closePolygon(): boolean {
    if (!this.currentSession || this.currentSession.currentPoints.length < 3) return false;

    this.currentSession.isCompleted = true;
    this.addAction('CLOSE_POLYGON', { allPoints: [...this.currentSession.currentPoints] });
    this.saveSessionToStorage();
    this.notifyListeners();

    return true;
  }

  static cancelSession(): void {
    if (!this.currentSession) return;

    this.addAction('CANCEL_DRAWING', {});
    this.clearSession();
  }

  static getCurrentSession(): DrawingSession | null {
    return this.currentSession;
  }

  static getSessionPoints(): DrawingPoint[] {
    return this.currentSession?.currentPoints || [];
  }

  static getPointsCount(): number {
    return this.currentSession?.currentPoints.length || 0;
  }

  static clearSession(): void {
    this.currentSession = null;
    this.removeSessionFromStorage();
    this.notifyListeners();
  }

  static recoverSession(): DrawingSession | null {
    try {
      const stored = localStorage.getItem('drawing_session');
      if (stored) {
        const session = JSON.parse(stored);
        session.timestamp = new Date(session.timestamp);
        session.actions = session.actions.map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp)
        }));
        
        // Só recupera se não foi completada e é recente (menos de 1 hora)
        const isRecent = Date.now() - session.timestamp.getTime() < 3600000;
        if (!session.isCompleted && isRecent) {
          this.currentSession = session;
          this.notifyListeners();
          return session;
        }
      }
    } catch (error) {
      console.error('Error recovering drawing session:', error);
    }

    return null;
  }

  private static addAction(type: DrawingAction['type'], data: DrawingAction['data']): void {
    if (!this.currentSession) return;

    const action: DrawingAction = {
      id: `action_${Date.now()}`,
      type,
      timestamp: new Date(),
      data
    };

    this.currentSession.actions.push(action);
  }

  private static saveSessionToStorage(): void {
    if (!this.currentSession) return;

    try {
      localStorage.setItem('drawing_session', JSON.stringify(this.currentSession));
    } catch (error) {
      console.error('Error saving drawing session:', error);
    }
  }

  private static removeSessionFromStorage(): void {
    try {
      localStorage.removeItem('drawing_session');
    } catch (error) {
      console.error('Error removing drawing session:', error);
    }
  }

  static addListener(callback: (session: DrawingSession | null) => void): void {
    this.listeners.push(callback);
  }

  static removeListener(callback: (session: DrawingSession | null) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentSession));
  }
}