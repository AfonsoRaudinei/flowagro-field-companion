import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { ArrowLeft, Compass, Layers, Edit3, Upload, Camera, Navigation, Cloud, Square, Circle, Pentagon, Route, MessageCircle, Plus, Minus, Trash2, LogOut, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { CameraService, eventTypes, FieldPhoto, CheckInOut } from '@/services/cameraService';
import { FileImportService, ImportedFile } from '@/services/fileImportService';
import { GPSService, UserLocation } from '@/services/gpsService';
import { TrailService, Trail } from '@/services/trailService';
import { WaypointService } from '@/services/waypointService';
import OfflineIndicator from '@/components/ui/offline-indicator';
import SyncIndicator from '@/components/ui/sync-indicator';
import ShapeEditControls from '@/components/ui/shape-edit-controls';
import { DrawingService, DrawingShape } from '@/services/drawingService';
import { DrawingUndoService, DrawingSession } from '@/services/drawingUndoService';
import { UnitService, UnitType } from '@/services/unitService';
import DrawingControls from '@/components/ui/drawing-controls';
import DrawingToolsPanel from '@/components/ui/drawing-tools-panel';
import { OfflineStorageService } from '@/services/offlineStorageService';
import FarmInfoCard from '@/components/FarmInfoCard';
import StatusCard from '@/components/StatusCard';
import { useGPSState } from '../hooks/useGPSState';
import { GPSStatusIndicator } from '../components/GPSStatusIndicator';
import { GPSButton } from '../components/GPSButton';
import SatelliteLayerSelector from '@/components/SatelliteLayerSelector';
import { satelliteService } from '@/services/satelliteService';
import { RouteRecorder } from '@/components/RouteRecorder';
import { RouteHistoryModal } from '@/components/RouteHistoryModal';
import { RouteViewer } from '@/components/RouteViewer';
import CompassDialIcon from '@/components/icons/CompassDialIcon';
import MapCore, { maplibregl } from '@/components/map/MapCore';

// Types for drawing management
interface DrawingMetadata {
  id: string;
  farmId: string;
  farmName: string;
  shapeType: string;
  timestamp: Date;
  coordinates?: any[];
}

const TechnicalMap: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Map state
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [bearing, setBearing] = useState(0);
  
  // User context
  const {
    userData,
    isConsultor,
    isProdutor,
    linkedProducers,
    selectedProducer,
    setSelectedProducer,
    ownFarm
  } = useUser();

  // UI state
  const [selectedPlot, setSelectedPlot] = useState<string>('Talhão 01 - Soja');
  const [currentLayer, setCurrentLayer] = useState<string>('satellite');
  const [showLayerSelector, setShowLayerSelector] = useState(false);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [currentDrawingPoints, setCurrentDrawingPoints] = useState<any[]>([]);
  const [hasOverlap, setHasOverlap] = useState(false);
  const [isPolygonClosed, setIsPolygonClosed] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number; } | null>(null);
  const [currentSession, setCurrentSession] = useState<DrawingSession | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<UnitType>('ha');

  // Farm info state
  const [selectedCulture, setSelectedCulture] = useState<string>('soja');
  const [selectedStage, setSelectedStage] = useState<string>('ve');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'error'>('synced');
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawings, setDrawings] = useState<DrawingMetadata[]>([]);
  const [fieldPhotos, setFieldPhotos] = useState<FieldPhoto[]>([]);
  const [showCameraEventSelector, setShowCameraEventSelector] = useState(false);
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
  const [shapes, setShapes] = useState<DrawingShape[]>([]);
  const [selectedShape, setSelectedShape] = useState<DrawingShape | null>(null);
  const [showRouteHistory, setShowRouteHistory] = useState(false);
  const [showRouteViewer, setShowRouteViewer] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Trail | null>(null);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [checkedInField, setCheckedInField] = useState<string | null>(null);
  const [checkInOutRecords, setCheckInOutRecords] = useState<CheckInOut[]>([]);

  // GPS state
  const { gpsState } = useGPSState();
  const isGPSActive = gpsState.isEnabled;
  const gpsAccuracy = gpsState.accuracy;
  const currentLocation = gpsState.lastLocation;

  const handleMapLoad = useCallback((mapInstance: maplibregl.Map) => {
    setMap(mapInstance);
    
    // Load existing shapes
    const loadShapes = async () => {
      const loadedShapes = await DrawingService.loadDrawings();
      setShapes(loadedShapes);
    };
    loadShapes();

    // Load existing trails
    const loadTrails = async () => {
      const loadedTrails = await TrailService.getStoredTrails();
      setTrails(loadedTrails);
    };
    loadTrails();

    // Load photos
    const loadPhotos = async () => {
      const photos = await CameraService.getStoredPhotos();
      setFieldPhotos(photos);
    };
    loadPhotos();

    // Setup drawing listeners
    DrawingService.addListener(setShapes);
    DrawingUndoService.addListener(setCurrentSession);

    return () => {
      DrawingService.removeListener(setShapes);
      DrawingUndoService.removeListener(setCurrentSession);
    };
  }, []);

  const handleMapRotate = useCallback(() => {
    if (map) {
      setBearing(map.getBearing());
    }
  }, [map]);

  // Tool handlers
  const handleToolSelect = useCallback((toolId: string) => {
    setSelectedTool(toolId);
    setIsDrawingActive(true);
    
    const currentFarm = isConsultor && selectedProducer ? 
      linkedProducers.find(p => p.id === selectedProducer.id) : 
      ownFarm;
    
    if (!currentFarm) {
      toast({
        title: "Erro",
        description: "Nenhuma fazenda selecionada",
        variant: "destructive"
      });
      return;
    }

    // Start drawing session
    const session = DrawingUndoService.startSession(
      currentFarm.id,
      currentFarm.name,
      toolId
    );
    setCurrentSession(session);
  }, [isConsultor, selectedProducer, linkedProducers, ownFarm, toast]);

  const handleLayerChange = useCallback((layerId: string) => {
    setCurrentLayer(layerId);
    // Update map style based on layer
    if (map) {
      // Implementation depends on satellite service integration
    }
  }, [map]);

  const handleBack = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // Map controls
  const handleZoomIn = () => map?.zoomIn();
  const handleZoomOut = () => map?.zoomOut();
  const handleRecenter = () => {
    if (currentLocation && map) {
      map.flyTo({
        center: [currentLocation.longitude, currentLocation.latitude],
        zoom: 16,
        essential: true
      });
    }
  };

  const resetBearing = () => map?.rotateTo(0);

  return (
    <div className="h-screen w-full relative overflow-hidden bg-background">
      {/* Map Container */}
      <MapCore
        options={{
          center: [-47.8825, -15.7942], // Brasília default
          zoom: 12,
          pitch: 0,
          bearing: 0,
          style: 'satellite'
        }}
        onMapLoad={handleMapLoad}
        onMapRotate={handleMapRotate}
        className="absolute inset-0"
      />

      {/* Header with back button */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleBack}
          className="bg-card/90 backdrop-blur-sm border border-border/50 shadow-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Compass */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={resetBearing}
          className="bg-card/90 backdrop-blur-sm p-3 rounded-full shadow-lg border border-border/50 hover:bg-card transition-colors"
        >
          <CompassDialIcon 
            className="w-8 h-8 text-foreground" 
            style={{ transform: `rotate(${-bearing}deg)` }}
          />
        </button>
      </div>

      {/* Left sidebar with controls */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowLayerSelector(!showLayerSelector)}
          className="w-12 h-12 bg-card/90 backdrop-blur-sm border border-border/50 shadow-lg"
        >
          <Layers className="w-5 h-5" />
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowDrawingTools(!showDrawingTools)}
          className="w-12 h-12 bg-card/90 backdrop-blur-sm border border-border/50 shadow-lg"
        >
          <Edit3 className="w-5 h-5" />
        </Button>
      </div>

      {/* Right sidebar with zoom controls */}
      <div className="absolute right-4 bottom-32 z-20 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomIn}
          className="w-12 h-12 bg-card/90 backdrop-blur-sm border border-border/50 shadow-lg"
        >
          <Plus className="w-5 h-5" />
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomOut}
          className="w-12 h-12 bg-card/90 backdrop-blur-sm border border-border/50 shadow-lg"
        >
          <Minus className="w-5 h-5" />
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRecenter}
          className="w-12 h-12 bg-card/90 backdrop-blur-sm border border-border/50 shadow-lg"
        >
          <Navigation className="w-5 h-5" />
        </Button>
      </div>

      {/* Layer Panel */}
      {showLayerSelector && (
        <div className="absolute left-20 top-1/2 -translate-y-1/2 z-30">
          <SatelliteLayerSelector
            onLayerChange={handleLayerChange}
            currentLayer={currentLayer}
            onClose={() => setShowLayerSelector(false)}
          />
        </div>
      )}

      {/* Drawing Tools Panel */}
      {showDrawingTools && (
        <div className="absolute left-20 top-1/2 -translate-y-1/2 z-30">
          <DrawingToolsPanel
            selectedTool={selectedTool}
            onToolSelect={(toolId) => {
              handleToolSelect(toolId);
              setTimeout(() => setShowDrawingTools(false), 200);
            }}
            onRemoveSelected={() => {
              if (selectedShape) {
                DrawingService.deleteDrawing(selectedShape.id);
              }
              setShowDrawingTools(false);
            }}
            onImportKML={() => fileInputRef.current?.click()}
            hasSelectedShape={!!selectedShape}
            className="w-72"
          />
        </div>
      )}

      {/* Drawing Controls - only show when actively drawing */}
      {currentSession && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30">
          <DrawingControls
            pointsCount={currentSession.currentPoints.length}
            canUndo={DrawingUndoService.canUndo()}
            onUndo={() => DrawingUndoService.undoLastPoint()}
            onCancel={() => {
              DrawingUndoService.cancelSession();
              setIsDrawingActive(false);
              setSelectedTool('');
            }}
            onSave={() => {
              DrawingUndoService.closePolygon();
              setIsDrawingActive(false);
              setSelectedTool('');
            }}
            areaM2={DrawingService.calculateArea(currentSession.currentPoints)}
            selectedUnit={selectedUnit}
            onUnitChange={setSelectedUnit}
            isPolygonCloseable={currentSession.currentPoints.length >= 3}
          />
        </div>
      )}

      {/* Status indicators */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        <OfflineIndicator />
        <SyncIndicator />
        <GPSStatusIndicator gpsState={gpsState} />
      </div>

      {/* Bottom navigation placeholder */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-card/90 backdrop-blur-sm rounded-full px-6 py-2 border border-border/50 shadow-lg">
          <span className="text-sm text-muted-foreground">Mapa Técnico</span>
        </div>
      </div>

      {/* Hidden file input for KML import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".kml,.kmz"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setImportedFile(file);
            // Handle KML import
          }
        }}
      />
    </div>
  );
};

export default TechnicalMap;