import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import type { Map, Marker, GeoJSONSource } from 'maplibre-gl';
// maplibre-gl CSS and module are loaded dynamically for better TTI
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
import MapView from "@/components/technical-map/MapView";
import LayerPanel from "@/components/technical-map/LayerPanel";
import Toolbars from "@/components/technical-map/Toolbars";
import RouteUI from "@/components/technical-map/RouteUI";

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
  const {
    toast
  } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const maplibre = useRef<null | (typeof import('maplibre-gl'))>(null);
  const map = useRef<Map | null>(null);
  const geolocateControlRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    userData,
    isConsultor,
    isProdutor,
    linkedProducers,
    selectedProducer,
    setSelectedProducer,
    ownFarm
  } = useUser();
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
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null);
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
  const [previewFile, setPreviewFile] = useState<ImportedFile | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [showDebugCoords, setShowDebugCoords] = useState(false);
  const [gpsWatchId, setGpsWatchId] = useState<string | null>(null);
  const [currentTrail, setCurrentTrail] = useState<Trail | null>(null);
  const [isRecordingTrail, setIsRecordingTrail] = useState(false);
  
  // Route recording state
  const [showRouteRecorder, setShowRouteRecorder] = useState(false);
  const [showRouteHistory, setShowRouteHistory] = useState(false);
  const [selectedViewTrail, setSelectedViewTrail] = useState<Trail | null>(null);
  const [showRouteViewer, setShowRouteViewer] = useState(false);

  // Live route/position visualization
  const liveRouteSourceId = 'live-route-source';
  const liveRouteLayerId = 'live-route-layer';
  const userMarkerRef = useRef<Marker | null>(null);
  const followUserRef = useRef(true);

  // Live route helpers (hoisted)
  function ensureLiveRouteLayer() {
    if (!map.current) return;
    if (!map.current.getSource(liveRouteSourceId)) {
      map.current.addSource(liveRouteSourceId, {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} }
      } as any);
    }
    if (!map.current.getLayer(liveRouteLayerId)) {
      map.current.addLayer({
        id: liveRouteLayerId,
        type: 'line',
        source: liveRouteSourceId,
        paint: { 'line-color': '#3b82f6', 'line-width': 4 }
      });
    }
  }

  function updateLiveRouteVisualization(trail: Trail) {
    if (!map.current) return;
    ensureLiveRouteLayer();
    const coords = (trail.points || []).map(p => [p.longitude, p.latitude]) as [number, number][];
    const src = map.current.getSource(liveRouteSourceId) as GeoJSONSource | undefined;
    if (src) {
      src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} } as any);
    }
    const last = coords[coords.length - 1];
    if (last) {
      if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'w-4 h-4 rounded-full bg-primary ring-2 ring-background shadow-md animate-pulse';
      userMarkerRef.current = new (maplibre.current as any).Marker({ element: el, anchor: 'center' }).setLngLat(last).addTo(map.current as any);
      } else {
        userMarkerRef.current.setLngLat(last);
      }
      if (followUserRef.current) {
        try { map.current.easeTo({ center: last, duration: 800 }); } catch {}
      }
    }
  }

  function clearLiveRouteVisualization() {
    if (!map.current) return;
    const src = map.current.getSource(liveRouteSourceId) as GeoJSONSource | undefined;
    if (src) {
      src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } as any);
    }
    if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null; }
  }

  // Enhanced GPS state management
  const { gpsState, checkGPSBeforeAction, getCurrentLocationWithFallback } = useGPSState();
  
  // Legacy GPS state for compatibility
  const isGPSEnabled = gpsState.isEnabled;
  const [drawnShapes, setDrawnShapes] = useState<DrawingShape[]>([]);
  const [selectedShape, setSelectedShape] = useState<DrawingShape | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shapeToDelete, setShapeToDelete] = useState<DrawingShape | null>(null);
  const [editingShape, setEditingShape] = useState<DrawingShape | null>(null);
  const [satelliteOverlays, setSatelliteOverlays] = useState<any[]>([]);
  const [loadingSatellite, setLoadingSatellite] = useState(false);
  const [pendingDrawing, setPendingDrawing] = useState<{
    shapeType: string;
    targetFarm: {
      id: string;
      farm: string;
    };
    areaM2?: number;
    areaHa?: number;
  } | null>(null);
  const [showDrawingConfirm, setShowDrawingConfirm] = useState(false);
  const [confirmFormData, setConfirmFormData] = useState({
    selectedProducerId: '',
    selectedFarmId: '',
    fieldName: ''
  });
  const mapLayers = [{
    id: 'satellite',
    name: 'Satélite',
    url: 'https://api.maptiler.com/maps/satellite/style.json?key=TomRDHESnrtpittgnpuf'
  }, {
    id: 'hybrid',
    name: 'Híbrido',
    url: 'https://api.maptiler.com/maps/hybrid/style.json?key=TomRDHESnrtpittgnpuf'
  }, {
    id: 'terrain',
    name: 'Terreno',
    url: 'https://api.maptiler.com/maps/landscape/style.json?key=TomRDHESnrtpittgnpuf'
  }];
  const drawingTools = [{
    id: 'freehand',
    name: 'Mão livre',
    emoji: '✏️',
    icon: Edit3
  }, {
    id: 'polygon',
    name: 'Polígono',
    emoji: '🔷',
    icon: Pentagon
  }, {
    id: 'pivot',
    name: 'Pivô',
    emoji: '💧',
    icon: Circle
  }, {
    id: 'rectangle',
    name: 'Retângulo',
    emoji: '◼️',
    icon: Square
  }, {
    id: 'remove',
    name: 'Remover',
    emoji: '🗑️',
    icon: Trash2
  }];
  const floatingActions = [{
    id: 'camera',
    name: 'Câmera',
    icon: Camera,
    priority: 1
  }, {
    id: 'routes',
    name: 'Rotas',
    icon: Route,
    priority: 2
  }, {
    id: 'events',
    name: 'Ocorrências',
    icon: MessageCircle,
    priority: 3
  }];

  // Enhanced event recording state
  const [showEventForm, setShowEventForm] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [eventFormData, setEventFormData] = useState({
    eventType: 'sugador' as const,
    quantity: '',
    severity: 'medio' as const,
    notes: '',
    latitude: 0,
    longitude: 0
  });
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInOutLoading, setCheckInOutLoading] = useState(false);

  // Info bar state
  const [currentField, setCurrentField] = useState<DrawingShape | null>(null);
  const [phenologicalStage, setPhenologicalStage] = useState<string>('vegetativo');
  const [showStageEditor, setShowStageEditor] = useState(false);
  const phenologicalStages = [{
    id: 'vegetativo',
    name: 'Vegetativo',
    emoji: '🌱'
  }, {
    id: 'florescimento',
    name: 'Florescimento',
    emoji: '🌸'
  }, {
    id: 'r1',
    name: 'R1 - Início do florescimento',
    emoji: '🌼'
  }, {
    id: 'r2',
    name: 'R2 - Florescimento pleno',
    emoji: '🌻'
  }, {
    id: 'r3',
    name: 'R3 - Início da formação da vagem',
    emoji: '🫘'
  }, {
    id: 'r4',
    name: 'R4 - Vagem completa',
    emoji: '🟢'
  }, {
    id: 'r5',
    name: 'R5 - Início do enchimento',
    emoji: '📈'
  }, {
    id: 'r6',
    name: 'R6 - Enchimento completo',
    emoji: '🔵'
  }, {
    id: 'r7',
    name: 'R7 - Início da maturação',
    emoji: '🟡'
  }, {
    id: 'r8',
    name: 'R8 - Maturação completa',
    emoji: '🟤'
  }];

  // Weather data (mock for demonstration)
  const weatherData = {
    temperature: 28,
    humidity: 65,
    windSpeed: 12,
    condition: '☀️'
  };
  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize OfflineStorageService first
    const initializeStorage = async () => {
      try {
        await OfflineStorageService.ensureInitialized();
        console.log('OfflineStorage initialized successfully in TechnicalMap');
      } catch (error) {
        console.error('Failed to initialize OfflineStorage:', error);
        toast({
          title: "Erro de inicialização",
          description: "Falha ao inicializar armazenamento offline",
          variant: "destructive"
        });
      }
    };
    initializeStorage();

    // Lazily load maplibre-gl and initialize map
    (async () => {
      const m = await import('maplibre-gl');
      await import('maplibre-gl/dist/maplibre-gl.css');
      maplibre.current = m;

      map.current = new m.Map({
        container: mapContainer.current!,
        style: mapLayers.find(l => l.id === currentLayer)?.url || mapLayers[0].url,
        center: [-52.0, -10.0],
        // Default center on Brazil
        zoom: 16,
        pitch: 0,
        bearing: 0
      });

      // Add map controls
      map.current.addControl(new m.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: false
      }), 'top-left');

      // Add geolocate control
      const geolocateControl = new m.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      });
      geolocateControlRef.current = geolocateControl;
      map.current.addControl(geolocateControl, 'top-left');
    })();

    // Handle map load errors
    map.current.on('error', e => {
      console.error('Map loading error:', e);
      toast({
        title: "Erro ao carregar o mapa",
        description: "Verifique a chave da API.",
        variant: "destructive"
      });
    });

    // Try to get user's location when map loads
    map.current.on('load', async () => {
      try {
        if (isGPSEnabled && userLocation) {
          map.current?.flyTo({
            center: [userLocation.longitude, userLocation.latitude],
            zoom: 16,
            duration: 1000
          });
        } else {
          // Try to trigger GPS location
          try {
            geolocateControlRef.current?.trigger();
          } catch (error) {
            console.log('GPS trigger failed, using default location');
          }
        }
       } catch (error) {
         console.log('Location unavailable, using default center');
       }
       // Prepare live route layer and draw current trail if any
       try {
         ensureLiveRouteLayer();
         if (currentTrail?.points?.length) {
           updateLiveRouteVisualization(currentTrail);
         }
       } catch (e) {
         console.warn('Live route layer init failed', e);
       }
     });

    // Initialize GPS and load data
    initializeGPS();

    // Load stored data
    const loadStoredData = async () => {
      try {
        const storedPhotos = await CameraService.getStoredPhotos();
        const storedImports = await FileImportService.getStoredImports();
        const storedDrawings = await DrawingService.loadDrawings();
        const activeTrail = TrailService.getCurrentTrail();
        setFieldPhotos(storedPhotos);
        setImportedFiles(storedImports);
        setDrawnShapes(storedDrawings);

        // Check if there's an active trail
        if (activeTrail?.isActive) {
          setCurrentTrail(activeTrail);
          setIsRecordingTrail(true);
        }

        // Listen for drawing updates
        DrawingService.addListener(setDrawnShapes);
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
    };
    loadStoredData();
    
    // Recuperar sessão de desenho se existir
    const recoveredSession = DrawingUndoService.recoverSession();
    if (recoveredSession) {
      toast({
        title: "Desenho recuperado",
        description: "Desenho em progresso foi recuperado!",
        variant: "default"
      });
      setCurrentDrawingPoints(recoveredSession.currentPoints);
      setSelectedTool('polygon');
      setIsDrawingActive(true);
      setShowInstructions(true);
    }

    // Listener para mudanças na sessão
    const handleSessionChange = (session: DrawingSession | null) => {
      setCurrentSession(session);
    };

    DrawingUndoService.addListener(handleSessionChange);

    return () => {
      // Cleanup GPS watch
      if (gpsWatchId) {
        GPSService.clearWatch(gpsWatchId);
      }
      // Remove drawing listener
      DrawingService.removeListener(setDrawnShapes);
      DrawingUndoService.removeListener(handleSessionChange);
      map.current?.remove();
    };
  }, []);
  const initializeGPS = async () => {
    try {
      // Check if permissions are already granted
      const hasPermission = await GPSService.checkPermissions();
      if (!hasPermission) {
        // Request permissions
        const granted = await GPSService.requestPermissions();
        if (!granted) {
          toast({
            title: "Permissão necessária",
            description: "Permissão de localização é necessária para usar o mapa técnico",
            variant: "destructive"
          });
          return;
        }
      }

      // Get initial location
      try {
        const location = await GPSService.getCurrentLocation();
        setUserLocation(location);
        toast({
          title: "GPS ativado",
          description: "Localização disponível",
          variant: "default"
        });

        // Center map on user location
        if (map.current) {
          map.current.flyTo({
            center: [location.longitude, location.latitude],
            zoom: 16,
            duration: 1000
          });
        }
      } catch (error) {
        toast({
          title: "Erro ao obter localização",
          description: "Verifique se o GPS está ativado",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('GPS initialization error:', error);
      toast({
        title: "Erro no GPS",
        description: "Não foi possível inicializar o GPS",
        variant: "destructive"
      });
    }
  };
  // Sync live route overlay with current trail
  useEffect(() => {
    if (!map.current) return;
    if (currentTrail?.isActive) {
      ensureLiveRouteLayer();
      updateLiveRouteVisualization(currentTrail);
    } else {
      clearLiveRouteVisualization();
    }
  }, [currentTrail]);

  const handleGPSRecenter = async () => {
    if (!isGPSEnabled) {
      await initializeGPS();
      return;
    }
    try {
      toast({
        title: "Obtendo localização...",
        description: "Aguarde um momento"
      });
      const location = await GPSService.getCurrentLocation();
      setUserLocation(location);
      if (map.current) {
        map.current.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 16,
          duration: 1000
        });
      }
      toast({
        title: "Localização atualizada",
        description: `Precisão: ${Math.round(location.accuracy)}m`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro ao obter localização",
        description: "Verifique se o GPS está ativado",
        variant: "destructive"
      });
    }
  };

  const handleLayerChange = async (layerId: string, options?: { date?: Date }) => {
    if (!map.current) return;
    setCurrentLayer(layerId);
    setShowLayerSelector(false);

    // Handle base layers
    const baseLayer = mapLayers.find(l => l.id === layerId);
     if (baseLayer) {
       map.current.setStyle(baseLayer.url);
       // Re-add live route layer after style changes
       map.current.once('style.load', () => {
         ensureLiveRouteLayer();
         if (currentTrail?.isActive) {
           updateLiveRouteVisualization(currentTrail);
         }
       });
       toast({
         title: "Camada alterada",
         description: `Visualizando: ${baseLayer.name}`,
         variant: "default"
       });
       return;
     }

    // Handle satellite layers
    if (layerId.includes('ndvi') || layerId.includes('biomassa') || layerId.includes('estresse') || 
        layerId.includes('vigor') || layerId.includes('crescimento') || layerId.includes('fase')) {
      
      setLoadingSatellite(true);
      toast({
        title: "Carregando dados de satélite...",
        description: "Aguarde um momento",
        variant: "default"
      });

      try {
        const bounds = map.current.getBounds();
        const bbox: [number, number, number, number] = [
          bounds.getWest(),
          bounds.getSouth(), 
          bounds.getEast(),
          bounds.getNorth()
        ];

        const source = layerId.includes('planet') ? 'planet' : 'sentinel';
        const layerType = layerId.includes('ndvi') ? 'ndvi' : 'true-color';
        
        const imageResponse = await satelliteService.getSatelliteImage({
          bbox,
          date: options?.date || new Date(),
          layerType,
          source
        });

        if (imageResponse.status === 'success') {
          // Clear previous overlays
          satelliteOverlays.forEach(overlay => {
            if (map.current?.getLayer(overlay.id)) {
              map.current.removeLayer(overlay.id);
              map.current.removeSource(overlay.id);
            }
          });

          // Add new overlay
          const layer = satelliteService.createNDVILayer(imageResponse, bbox);
          if (layer && map.current) {
            map.current.addSource(layer.id, layer.source);
            map.current.addLayer({
              id: layer.id,
              type: 'raster',
              source: layer.id,
              paint: layer.paint
            });

            setSatelliteOverlays([layer]);
            toast({
              title: "Camada de satélite carregada",
              description: `${imageResponse.metadata.source} - ${imageResponse.metadata.date}`,
              variant: "default"
            });
          }
        } else if (imageResponse.status === 'activating') {
          toast({
            title: "Ativando imagem",
            description: "Tente novamente em alguns minutos",
            variant: "default"
          });
        } else {
          toast({
            title: "Erro ao carregar imagem",
            description: imageResponse.error || "Dados não disponíveis",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error loading satellite data:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Verifique sua conexão",
          variant: "destructive"
        });
      } finally {
        setLoadingSatellite(false);
      }
    }
  };
  // Simular detecção de sobreposição
  const checkOverlapWithExistingShapes = (newPoints: any[]) => {
    // Simulação simples - considera sobreposição se já existem formas na área
    const hasNearbyShapes = drawnShapes.some(shape => 
      shape.points && shape.points.length > 0 && 
      Math.random() > 0.7 // 30% chance de sobreposição para demonstração
    );
    return hasNearbyShapes;
  };

  const handleToolSelect = (toolId: string) => {
    const targetFarm = isConsultor ? selectedProducer : ownFarm;

    // Check if a farm is selected (for consultants) or available (for producers)
    if (!targetFarm) {
      toast({
        title: "Fazenda não selecionada",
        description: isConsultor ? "Selecione um produtor antes de desenhar" : "Dados da fazenda não disponíveis",
        variant: "destructive"
      });
      return;
    }

    setSelectedTool(toolId);

    // Handle remove tool differently
    if (toolId === 'remove') {
      setIsDrawingActive(false);
      setShowInstructions(true);
      if (mapContainer.current) {
        mapContainer.current.style.cursor = 'pointer';
      }
      
      toast({
        title: "🗑️ Modo remoção ativado",
        description: "Toque em uma área para remover",
        variant: "default"
      });

      // Add click listener for removal
      const handleRemoveClick = (e: any) => {
        // Simular remoção de forma tocada
        if (drawnShapes.length > 0) {
          const shapeToRemove = drawnShapes[Math.floor(Math.random() * drawnShapes.length)];
          
          // Primeiro clique: destacar forma para remoção (simulação)
          const isPendingRemoval = Math.random() > 0.5; // Simular estado pendente
          if (!isPendingRemoval) {
            toast({
              title: "Área selecionada para remoção",
              description: "Toque novamente para confirmar a exclusão",
              variant: "default"
            });
            // Marcar forma como pendente de remoção (simulação)
            return;
          }
          
          // Segundo clique: remover forma
          DrawingService.deleteDrawing(shapeToRemove.id);
          toast({
            title: "Área removida",
            description: "A região foi excluída com sucesso",
            variant: "default"
          });
        } else {
          toast({
            title: "Nenhuma área encontrada",
            description: "Não há áreas para remover nesta localização",
            variant: "default"
          });
        }
        
        // Reset removal mode
        setSelectedTool('');
        setShowInstructions(false);
        setIsPolygonClosed(false);
        if (mapContainer.current) {
          mapContainer.current.style.cursor = 'default';
          mapContainer.current?.removeEventListener('click', handleRemoveClick);
        }
      };

      mapContainer.current?.addEventListener('click', handleRemoveClick);
      return;
    }

    // Ativar modo de desenho para outras ferramentas
    setIsDrawingActive(true);
    setShowInstructions(true);
    setCurrentDrawingPoints([]);
    setHasOverlap(false);
    setIsPolygonClosed(false);
    
    // Iniciar nova sessão de desenho
    const currentFarm = selectedProducer || ownFarm;
    if (currentFarm) {
      DrawingUndoService.startSession(
        currentFarm.id,
        currentFarm.farm,
        toolId
      );
    }

    // Add visual feedback to map container
    if (mapContainer.current) {
      mapContainer.current.style.cursor = 'crosshair';
      mapContainer.current.classList.add('drawing-active');
    }

    // Show instruction message
    toast({
      title: "✏️ Modo desenho ativo",
      description: "Toque no mapa para iniciar a área",
      variant: "default"
    });

    // Add mouse move listener for real-time line preview
    const handleMouseMove = (e: any) => {
      if (!isDrawingActive) return;
      
      const rect = mapContainer.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setMousePosition({ x, y });
    };

    // Add click listener for drawing
    const handleMapDrawClick = (e: any) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = mapContainer.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Simular coordenadas geográficas
      const lat = -15.7942 + (y - rect.height/2) * 0.0001;
      const lng = -47.8825 + (x - rect.width/2) * 0.0001;

      const newPoint = { x, y, lat, lng };

      // Adicionar ponto à sessão
      DrawingUndoService.addPoint(newPoint);

      // Check if clicking on first point to close polygon
      if (currentDrawingPoints.length >= 3) {
        const firstPoint = currentDrawingPoints[0];
        const distance = Math.sqrt(Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2));
        
        if (distance < 20) { // 20px threshold for closing
          setIsPolygonClosed(true);
          finishDrawing(toolId, currentDrawingPoints, targetFarm);
          toast({
            title: "✅ Área desenhada com sucesso",
            description: "Polígono fechado automaticamente",
            variant: "default"
          });
          return;
        }
      }

      const updatedPoints = [...currentDrawingPoints, newPoint];
      setCurrentDrawingPoints(updatedPoints);

      // Verificar sobreposição após adicionar ponto
      if (updatedPoints.length >= 3) {
        const hasOverlapDetected = checkOverlapWithExistingShapes(updatedPoints);
        setHasOverlap(hasOverlapDetected);
        
        if (hasOverlapDetected) {
          toast({
            title: "⚠️ Sobreposição detectada",
            description: "A área sobrepõe uma região existente",
            variant: "destructive"
          });
        }
      }

      // For rectangle, auto-close after 4 points
      if (toolId === 'rectangle' && updatedPoints.length >= 4) {
        setIsPolygonClosed(true);
        finishDrawing(toolId, updatedPoints, targetFarm);
      }
    };

    // Add event listeners to map container
    if (mapContainer.current) {
      mapContainer.current.addEventListener('click', handleMapDrawClick);
      mapContainer.current.addEventListener('mousemove', handleMouseMove);
    }
  };

  const finishDrawing = (toolId: string, points: any[], targetFarm: any) => {
    // Remove drawing mode styling and event listeners
    if (mapContainer.current) {
      mapContainer.current.style.cursor = 'default';
      mapContainer.current.classList.remove('drawing-active');
      
      // Remove event listeners
      const elements = mapContainer.current.querySelectorAll('*');
      elements.forEach(el => {
        el.removeEventListener('click', () => {});
        el.removeEventListener('mousemove', () => {});
      });
    }

    setIsDrawingActive(false);
    setShowInstructions(false);
    setMousePosition(null);
    setIsPolygonClosed(false);

    // Initialize form data when showing confirmation
    const defaultProducerId = isProdutor ? ownFarm?.id || '' : selectedProducer?.id || '';
    const defaultFarmId = isProdutor ? ownFarm?.id || '' : selectedProducer?.id || '';
    setConfirmFormData({
      selectedProducerId: defaultProducerId,
      selectedFarmId: defaultFarmId,
      fieldName: ''
    });

    // Calculate mock area
    const mockArea = Math.random() * 50000 + 10000; // Mock area between 1-5 hectares
    const areaHa = Math.round(mockArea / 10000 * 100) / 100;
    setPendingDrawing({
      shapeType: toolId,
      targetFarm,
      areaM2: mockArea,
      areaHa: areaHa
    });
    setShowDrawingConfirm(true);
    setCurrentDrawingPoints([]);
    
    toast({
      title: "✅ Desenho concluído",
      description: "Configure os dados da área abaixo",
      variant: "default"
    });
  };
  const saveDrawing = async (shapeType: string, targetFarm: {
    id: string;
    farm: string;
  }) => {
    const newDrawing: DrawingShape = {
      id: `drawing-${Date.now()}`,
      farmId: targetFarm.id,
      farmName: targetFarm.farm,
      shapeType: shapeType as any,
      points: [
      // Mock points - would be actual drawing coordinates
      {
        x: 100,
        y: 100,
        lat: -15.7942,
        lng: -47.8825
      }, {
        x: 200,
        y: 100,
        lat: -15.7940,
        lng: -47.8820
      }, {
        x: 200,
        y: 200,
        lat: -15.7938,
        lng: -47.8820
      }, {
        x: 100,
        y: 200,
        lat: -15.7938,
        lng: -47.8825
      }],
      timestamp: new Date()
    };
    await DrawingService.saveDrawing(newDrawing);
    setIsDrawingMode(false);
    setSelectedTool('');
    const shapeNames = {
      freehand: 'Área livre',
      polygon: 'Polígono',
      pivot: 'Área de pivô',
      rectangle: 'Área retangular'
    };
    toast({
      title: "Área salva com sucesso!",
      description: `${shapeNames[shapeType as keyof typeof shapeNames]} salva para ${targetFarm.farm}`,
      variant: "default"
    });
  };
  const handleShapeClick = (shape: DrawingShape, event: React.MouseEvent) => {
    event.stopPropagation();
    const targetFarm = isConsultor ? selectedProducer : ownFarm;
    const canEdit = targetFarm && DrawingService.canEdit(shape, targetFarm.id, isConsultor, selectedProducer?.id);
    if (canEdit) {
      const clickedShape = DrawingService.selectShape(shape.id);
      setSelectedShape(clickedShape);
    } else {
      toast({
        title: "Acesso negado",
        description: "Você não pode editar esta área",
        variant: "destructive"
      });
    }
  };
  const handleEditShape = () => {
    if (selectedShape) {
      setEditingShape(selectedShape);
      toast({
        title: "Modo de edição",
        description: "Modifique a forma e toque para salvar",
        variant: "default"
      });
    }
  };
  const handleDeleteShape = () => {
    if (selectedShape) {
      setShapeToDelete(selectedShape);
      setShowDeleteConfirm(true);
    }
  };
  const confirmDeleteShape = async () => {
    if (shapeToDelete) {
      await DrawingService.deleteDrawing(shapeToDelete.id);
      setSelectedShape(null);
      setShapeToDelete(null);
      setShowDeleteConfirm(false);
      toast({
        title: "Área removida",
        description: `${shapeToDelete.farmName} - área excluída`,
        variant: "default"
      });
    }
  };
  const handleMapClick = () => {
    // Deselect shape when clicking on empty map area
    if (selectedShape && !editingShape) {
      DrawingService.deselectShape();
      setSelectedShape(null);
    }
  };
  const handleCameraEventSelect = async (eventType: string) => {
    const targetFarm = isConsultor ? selectedProducer : ownFarm;
    if (!targetFarm) {
      toast({
        title: "Fazenda não selecionada",
        description: isConsultor ? "Selecione um produtor antes de tirar foto" : "Dados da fazenda não disponíveis",
        variant: "destructive"
      });
      return;
    }
    setShowCameraEventSelector(false);
    try {
      // Show loading toast
      toast({
        title: "Abrindo câmera...",
        description: "Aguarde um momento"
      });

      // Take photo
      const imagePath = await CameraService.takePhoto();

      // Get current location
      const location = await CameraService.getCurrentLocation();

      // Find event details
      const eventDetails = eventTypes.find(e => e.id === eventType);

      // Create photo metadata
      const photo: FieldPhoto = {
        id: `photo-${Date.now()}`,
        farmId: targetFarm.id,
        farmName: targetFarm.farm,
        eventType: eventType as any,
        eventLabel: eventDetails?.name || eventType,
        imagePath,
        latitude: location?.latitude,
        longitude: location?.longitude,
        timestamp: new Date(),
        severity: 'medio' // Default severity, will be updated by event form
      };

      // Save photo
      await CameraService.savePhoto(photo);

      // Update local state
      setFieldPhotos(prev => [...prev, photo]);

      // Show success message
      toast({
        title: "Foto registrada com sucesso!",
        description: `${eventDetails?.emoji} ${eventDetails?.name} em ${targetFarm.farm}`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro ao tirar foto",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  // Enhanced camera and event recording functions
  const handleCameraOpen = async () => {
    try {
      // Take photo first
      const imagePath = await CameraService.takePhoto();

      // Get current location
      const location = await GPSService.getCurrentLocation();

      // Set captured photo and location data
      setCapturedPhoto(imagePath);
      setEventFormData(prev => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude
      }));

      // Show event form
      setShowEventForm(true);
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "Erro ao acessar a câmera",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };
  const handleEventFormSubmit = async () => {
    if (!capturedPhoto) return;
    try {
      // Get target farm based on user type
      const targetFarm = isConsultor ? selectedProducer : ownFarm;
      if (!targetFarm) {
        toast({
          title: "Erro",
          description: "Produtor não selecionado",
          variant: "destructive"
        });
        return;
      }
      const eventDetails = eventTypes.find(e => e.id === eventFormData.eventType);
      const photo: FieldPhoto = {
        id: `photo-${Date.now()}`,
        farmId: targetFarm.id,
        farmName: targetFarm.farm,
        eventType: eventFormData.eventType,
        eventLabel: eventDetails?.name || eventFormData.eventType,
        imagePath: capturedPhoto,
        latitude: eventFormData.latitude,
        longitude: eventFormData.longitude,
        timestamp: new Date(),
        severity: eventFormData.severity,
        quantity: eventFormData.quantity ? parseInt(eventFormData.quantity) : undefined,
        notes: eventFormData.notes.trim() || undefined
      };
      await CameraService.savePhoto(photo);

      // Create chat message
      const chatMessage = CameraService.createChatMessage(photo);

      // Reset form
      setShowEventForm(false);
      setCapturedPhoto(null);
      setEventFormData({
        eventType: 'sugador',
        quantity: '',
        severity: 'medio',
        notes: '',
        latitude: 0,
        longitude: 0
      });
      toast({
        title: "Registro salvo!",
        description: "Evento registrado e enviado para o chat do produtor",
        variant: "default"
      });
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar evento",
        variant: "destructive"
      });
    }
  };
  const handleCheckInOut = async () => {
    setCheckInOutLoading(true);
    try {
      const location = await GPSService.getCurrentLocation();
      const targetFarm = isConsultor ? selectedProducer : ownFarm;
      if (!targetFarm) {
        toast({
          title: "Erro",
          description: "Produtor não selecionado",
          variant: "destructive"
        });
        setCheckInOutLoading(false);
        return;
      }
      const eventType = isCheckedIn ? 'checkout' : 'checkin';
      const checkInOut: CheckInOut = {
        id: `checkinout-${Date.now()}`,
        farmId: targetFarm.id,
        farmName: targetFarm.farm,
        type: eventType,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date()
      };
      await CameraService.saveCheckInOut(checkInOut);
      const time = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const emoji = eventType === 'checkin' ? '🟢' : '🔴';
      const action = eventType === 'checkin' ? 'Chegada' : 'Saída';
      setIsCheckedIn(!isCheckedIn);
      toast({
        title: `${emoji} ${action} registrada`,
        description: `${action} às ${time} na ${targetFarm.farm}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Check-in/out error:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar entrada/saída",
        variant: "destructive"
      });
    } finally {
      setCheckInOutLoading(false);
    }
  };

  // Field intersection detection
  const checkCurrentFieldIntersection = () => {
    if (!userLocation || !drawnShapes.length) {
      setCurrentField(null);
      return;
    }

    // Simple point-in-polygon check (basic implementation)
    const currentLat = userLocation.latitude;
    const currentLng = userLocation.longitude;
    for (const shape of drawnShapes) {
      if (shape.points && shape.points.length >= 3) {
        // Basic bounding box check first for performance
        const lats = shape.points.map(p => p.lat || 0).filter(lat => lat !== 0);
        const lngs = shape.points.map(p => p.lng || 0).filter(lng => lng !== 0);
        if (lats.length > 0 && lngs.length > 0) {
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          if (currentLat >= minLat && currentLat <= maxLat && currentLng >= minLng && currentLng <= maxLng) {
            setCurrentField(shape);
            return;
          }
        }
      }
    }
    setCurrentField(null);
  };

  // Update field intersection when location changes
  useEffect(() => {
    checkCurrentFieldIntersection();
  }, [userLocation, drawnShapes]);
  const handleZoomIn = () => {
    if (map.current) {
      map.current.zoomIn({
        duration: 300
      });
    }
  };
  const handleZoomOut = () => {
    if (map.current) {
      map.current.zoomOut({
        duration: 300
      });
    }
  };
  const handleTrailToggle = async () => {
    const targetFarm = isConsultor ? selectedProducer : ownFarm;
    if (!targetFarm) {
      toast({
        title: "Fazenda não selecionada",
        description: isConsultor ? "Selecione um produtor antes de gravar trilha" : "Dados da fazenda não disponíveis",
        variant: "destructive"
      });
      return;
    }
    if (!isGPSEnabled) {
      toast({
        title: "GPS não disponível",
        description: "Ative o GPS antes de gravar trilhas",
        variant: "destructive"
      });
      return;
    }
    try {
      if (isRecordingTrail) {
        // Stop recording
        const completedTrail = await TrailService.stopTrailRecording();
        setIsRecordingTrail(false);
        setCurrentTrail(null);
        if (completedTrail) {
          toast({
            title: "Trilha salva!",
            description: `📍 ${TrailService.formatDistance(completedTrail.totalDistance || 0)} em ${targetFarm.farm}`,
            variant: "default"
          });
        }
      } else {
        // Start recording
        const trail = await TrailService.startTrailRecording(targetFarm.id, targetFarm.farm, updatedTrail => {
          setCurrentTrail(updatedTrail);
          // Could update map here with new points
        });
        setIsRecordingTrail(true);
        setCurrentTrail(trail);
        toast({
          title: "Gravando trilha...",
          description: `📍 Trilha iniciada em ${targetFarm.farm}`,
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Erro na trilha",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };
  const handleFileImport = async () => {
    const targetFarm = isConsultor ? selectedProducer : ownFarm;
    if (!targetFarm) {
      toast({
        title: "Fazenda não selecionada",
        description: isConsultor ? "Selecione um produtor antes de importar" : "Dados da fazenda não disponíveis",
        variant: "destructive"
      });
      return;
    }
    try {
      toast({
        title: "Abrindo seletor de arquivos...",
        description: "Selecione um arquivo KML ou KMZ"
      });
      const file = await FileImportService.importFile();
      if (!file) {
        toast({
          title: "Importação cancelada",
          variant: "default"
        });
        return;
      }
      if (!file.name.endsWith('.kml') && !file.name.endsWith('.kmz')) {
        toast({
          title: "Formato não suportado",
          description: "Selecione apenas arquivos .kml ou .kmz",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "Processando arquivo...",
        description: "Aguarde um momento"
      });
      const importedFile = await FileImportService.saveImportedFile(file, targetFarm.id, targetFarm.farm);

      // Update local state
      setImportedFiles(prev => [...prev, importedFile]);
      setPreviewFile(importedFile);
      toast({
        title: "Área importada com sucesso!",
        description: `📁 ${file.name} para ${targetFarm.farm}`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro ao importar arquivo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };
  const handleConfirmDrawing = async () => {
    if (pendingDrawing && confirmFormData.fieldName.trim()) {
      // Get selected producer/farm info
      const selectedProducerInfo = isConsultor ? linkedProducers.find(p => p.id === confirmFormData.selectedProducerId) : ownFarm;
      if (!selectedProducerInfo) {
        toast({
          title: "Erro na seleção",
          description: "Produtor ou fazenda não encontrados",
          variant: "destructive"
        });
        return;
      }

      // Enhanced drawing with additional metadata
      const newDrawing: DrawingShape = {
        id: `drawing-${Date.now()}`,
        farmId: confirmFormData.selectedFarmId,
        farmName: selectedProducerInfo.farm,
        fieldName: confirmFormData.fieldName,
        shapeType: pendingDrawing.shapeType as any,
        points: [
        // Mock points - would be actual drawing coordinates
        {
          x: 100,
          y: 100,
          lat: -15.7942,
          lng: -47.8825
        }, {
          x: 200,
          y: 100,
          lat: -15.7940,
          lng: -47.8820
        }, {
          x: 200,
          y: 200,
          lat: -15.7938,
          lng: -47.8820
        }, {
          x: 100,
          y: 200,
          lat: -15.7938,
          lng: -47.8825
        }],
        timestamp: new Date(),
        areaM2: pendingDrawing.areaM2,
        areaHa: pendingDrawing.areaHa
      };
      await DrawingService.saveDrawing(newDrawing);

      // Reset form and state
      setPendingDrawing(null);
      setShowDrawingConfirm(false);
      setSelectedTool('');
      setConfirmFormData({
        selectedProducerId: '',
        selectedFarmId: '',
        fieldName: ''
      });
      const areaText = pendingDrawing.areaHa ? ` Área: ${pendingDrawing.areaHa} ha` : '';
      toast({
        title: "Talhão salvo com sucesso!",
        description: `Talhão "${confirmFormData.fieldName}" salvo para ${selectedProducerInfo.farm}.${areaText}`,
        variant: "default"
      });
    } else {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o talhão",
        variant: "destructive"
      });
    }
  };
  const handleCancelDrawing = () => {
    setPendingDrawing(null);
    setShowDrawingConfirm(false);
    setSelectedTool('');
    setConfirmFormData({
      selectedProducerId: '',
      selectedFarmId: '',
      fieldName: ''
    });
    toast({
      title: "Desenho cancelado",
      description: "Área não foi salva",
      variant: "default"
    });
  };

  // Handlers para undo/rollback
  const handleUndoLastPoint = () => {
    const removedPoint = DrawingUndoService.undoLastPoint();
    if (removedPoint) {
      const sessionPoints = DrawingUndoService.getSessionPoints();
      setCurrentDrawingPoints(sessionPoints);
      toast({
        title: "Ponto removido",
        description: "Último ponto foi removido",
        variant: "default"
      });
    }
  };

  const handleCancelCurrentDrawing = () => {
    DrawingUndoService.cancelSession();
    setCurrentDrawingPoints([]);
    setSelectedTool('');
    setIsDrawingActive(false);
    setShowInstructions(false);
    setIsPolygonClosed(false);
    setMousePosition(null);
    
    if (mapContainer.current) {
      mapContainer.current.style.cursor = 'default';
      mapContainer.current.classList.remove('drawing-active');
    }
    
    toast({
      title: "Desenho cancelado",
      description: "Desenho foi cancelado",
      variant: "default"
    });
  };

  const handleCompleteDrawing = () => {
    if (!currentSession) return;
    
    const points = DrawingUndoService.getSessionPoints();
    if (points.length >= 3) {
      const currentFarm = selectedProducer || ownFarm;
      if (currentFarm) {
        finishDrawing('polygon', points, {
          id: currentFarm.id,
          farm: currentFarm.farm
        });
      }
    }
  };

  const calculateCurrentArea = useCallback(() => {
    if (currentDrawingPoints.length < 3) return 0;
    // Use private method from DrawingService for area calculation
    return (DrawingService as any).calculateArea(currentDrawingPoints);
  }, [currentDrawingPoints]);
  const handleBack = () => {
    // Navigation logic would go here
    navigate('/login-form');
  };

  const handleRouteComplete = (trail: Trail) => {
    setCurrentTrail(null);
    setIsRecordingTrail(false);
    setShowRouteRecorder(false);
    
    // Clear live visualization
    clearLiveRouteVisualization();
    
    // Show route viewer for completed trail
    setSelectedViewTrail(trail);
    setShowRouteViewer(true);
  };

  const handleViewRoute = (trail: Trail) => {
    setSelectedViewTrail(trail);
    setShowRouteHistory(false);
    setShowRouteViewer(true);
  };

  const handleFloatingAction = async (actionId: string) => {
    if (!selectedProducer && !ownFarm) {
      toast({
        title: "Seleção necessária",
        description: "Selecione um produtor primeiro",
        variant: "destructive"
      });
      return;
    }

    const farmId = selectedProducer?.id || ownFarm?.id || '';
    const farmName = selectedProducer?.farm || ownFarm?.name || '';

    if (actionId === 'camera') {
      // Check GPS and proceed to camera
      const canProceed = await checkGPSBeforeAction("Para tirar fotos geolocalizadas, o GPS deve estar habilitado.");
      if (canProceed) {
        setShowCameraEventSelector(true);
      }
    } else if (actionId === 'routes') {
      // Toggle route recording interface
      const canProceed = await checkGPSBeforeAction("Para gravar rotas, o GPS deve estar habilitado.");
      if (canProceed) {
        setShowRouteRecorder(!showRouteRecorder);
      }
    } else if (actionId === 'events') {
      // Show last 10 photos
      const photos = await CameraService.getStoredPhotos();
      const recentPhotos = photos.slice(-10).reverse();
      let message = recentPhotos.length > 0 
        ? "Últimos eventos:\n\n" + recentPhotos.map(photo => CameraService.createChatMessage(photo)).join('\n\n')
        : "Nenhum evento registrado ainda.";
      
      if (message.length > 1000) {
        message = message.substring(0, 1000) + "...";
      }
      
      alert(message);
    }
  };
  return <>
      <style>{`
        .drawing-active {
          border: 2px dashed hsl(var(--primary)) !important;
          animation: dash 1.5s linear infinite;
        }
        
        @keyframes dash {
          to {
            stroke-dashoffset: -10;
          }
        }
      `}</style>
      
      <div className="relative w-full h-screen overflow-hidden bg-background">
        {/* Map Container */}
        <MapView containerRef={mapContainer} className="absolute inset-0" onClick={handleMapClick} />
        
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            {/* Back Button */}
            <Button
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md border border-border hover:bg-white"
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          {/* Status Card no topo direito */}
          <StatusCard isOnline={isOnline} syncStatus={syncStatus} weather={weatherData} onClick={() => {
          toast({
            title: "Status do Sistema",
            description: `Conectado: ${isOnline ? 'Sim' : 'Não'} • Sync: ${syncStatus}`,
            variant: "default"
          });
        }} />
        </div>

        {/* Instruction Message for Drawing Mode */}
        {showInstructions && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30">
            <Card className="bg-card/95 backdrop-blur-sm border border-border shadow-lg">
              <div className="px-4 py-2">
                <div className="text-sm font-medium text-foreground flex items-center space-x-2">
                  {selectedTool === 'remove' ? (
                    <>
                      <span className="text-destructive">🗑️</span>
                      <span>Toque em uma área para remover</span>
                    </>
                  ) : isPolygonClosed ? (
                    <>
                      <span className="text-green-500">✅</span>
                      <span>Área desenhada com sucesso</span>
                    </>
                  ) : currentDrawingPoints.length === 0 ? (
                    <>
                      <span className="text-primary">✏️</span>
                      <span>Toque no mapa para iniciar a área</span>
                    </>
                  ) : (
                    <>
                      <span className="text-blue-500">🔵</span>
                      <span>Continue adicionando pontos ou toque no primeiro para fechar</span>
                    </>
                  )}
                </div>
                {hasOverlap && (
                  <div className="text-xs text-destructive mt-1 flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>Sobreposição detectada</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Enhanced Drawing Visualization */}
        {isDrawingActive && currentDrawingPoints.length > 0 && (
          <>
            {/* SVG for drawing lines and area */}
            <svg className="absolute inset-0 z-20 pointer-events-none" style={{ width: '100%', height: '100%' }}>
              {/* Area fill */}
              {currentDrawingPoints.length >= 3 && (
                <polygon
                  points={currentDrawingPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill={hasOverlap ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'}
                  stroke={hasOverlap ? '#ef4444' : '#3b82f6'}
                  strokeWidth="2"
                  strokeDasharray={hasOverlap ? "5,5" : "none"}
                  opacity="0.8"
                />
              )}
              
              {/* Connection lines */}
              {currentDrawingPoints.length > 1 && (
                <polyline
                  points={currentDrawingPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  opacity="0.8"
                />
              )}
              
              {/* Real-time line from last point to mouse */}
              {currentDrawingPoints.length > 0 && mousePosition && !isPolygonClosed && (
                <line
                  x1={currentDrawingPoints[currentDrawingPoints.length - 1].x}
                  y1={currentDrawingPoints[currentDrawingPoints.length - 1].y}
                  x2={mousePosition.x}
                  y2={mousePosition.y}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  opacity="0.5"
                  strokeDasharray="3,3"
                />
              )}
            </svg>

            {/* Vertex points */}
            {currentDrawingPoints.map((point, index) => (
              <div
                key={index}
                className={`absolute rounded-full shadow-lg z-25 pointer-events-none transition-all duration-200 ${
                  index === 0 
                    ? 'w-4 h-4 bg-green-500 border-2 border-white' // First point - green
                    : 'w-3 h-3 bg-blue-500 border-2 border-white'   // Other points - blue
                }`}
                style={{
                  left: point.x - (index === 0 ? 8 : 6),
                  top: point.y - (index === 0 ? 8 : 6),
                }}
              />
            ))}
            
            {/* First point hover area for closing polygon */}
            {currentDrawingPoints.length >= 3 && !isPolygonClosed && (
              <div
                className="absolute w-8 h-8 rounded-full border-2 border-green-400 bg-green-400/20 z-24 pointer-events-none animate-pulse"
                style={{
                  left: currentDrawingPoints[0].x - 16,
                  top: currentDrawingPoints[0].y - 16,
                }}
              />
            )}
          </>
        )}

        {/* Drawing Controls */}
        {currentSession && (
          <DrawingControls
            pointsCount={DrawingUndoService.getPointsCount()}
            canUndo={DrawingUndoService.canUndo()}
            onUndo={handleUndoLastPoint}
            onCancel={handleCancelCurrentDrawing}
            onSave={handleCompleteDrawing}
            areaM2={calculateCurrentArea()}
            selectedUnit={selectedUnit}
            onUnitChange={setSelectedUnit}
            isPolygonCloseable={currentDrawingPoints.length >= 3 && isPolygonClosed}
          />
        )}

        {/* Card Minha Fazenda - Canto superior direito */}
        <div className="absolute top-4 right-4 z-30 w-56">
          <FarmInfoCard />
        </div>

        {/* GPS Status Indicator */}
        <div className="absolute top-4 left-4 z-10">
          <GPSStatusIndicator gpsState={gpsState} />
        </div>

        {/* Left Floating Toolbar */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col space-y-2">
          {/* Trail Button */}
          <GPSButton
            gpsState={gpsState}
            icon={<Route className="h-4 w-4" />}
            onClick={handleTrailToggle}
            requiresGPS={true}
            tooltip={isRecordingTrail ? "Parar gravação" : "Gravar trilha"}
            variant={isRecordingTrail ? "destructive" : "ghost"}
            className={`w-10 h-10 rounded-full backdrop-blur-sm shadow-md border border-border hover:bg-white ${isRecordingTrail ? 'animate-pulse' : 'bg-white/90'}`}
            size="sm"
          />

          {/* Back Button */}
          

          {/* Layers Button */}
          <Button onClick={() => setShowLayerSelector(!showLayerSelector)} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md border border-border hover:bg-white" variant="ghost" size="sm">
            <Layers className={`h-4 w-4 ${showLayerSelector ? 'text-primary' : 'text-muted-foreground'}`} />
          </Button>

          {/* Drawing Tools Button */}
          <Button onClick={() => setShowDrawingTools(!showDrawingTools)} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md border border-border hover:bg-white" variant="ghost" size="sm">
            <Edit3 className={`h-4 w-4 ${showDrawingTools ? 'text-primary' : 'text-muted-foreground'}`} />
          </Button>

        </div>

        {/* Right Floating Toolbar - Reorganizado por prioridade */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col space-y-3">
          {/* GPS Fix Button */}
          <GPSButton
            gpsState={gpsState}
            icon={<Navigation className="h-5 w-5" />}
            onClick={handleGPSRecenter}
            requiresGPS={true}
            tooltip="Centralizar no GPS"
            variant="ghost"
            className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border hover:scale-105 transition-transform"
            size="sm"
          />

          {/* Zoom In */}
          

          {/* Zoom Out */}
          

          {/* PRIORIDADE 1: Câmera - Destaque especial */}
          <GPSButton
            gpsState={gpsState}
            icon={<Camera className="h-6 w-6 text-primary-foreground" />}
            onClick={handleCameraOpen}
            requiresGPS={false}
            tooltip="Capturar evento"
            variant="ghost"
            className="w-14 h-14 rounded-full bg-primary/90 backdrop-blur-sm shadow-lg border-2 border-primary hover:scale-105 transition-transform"
            size="sm"
          />


          {/* PRIORIDADE 3: Ocorrências */}
          
        </div>

        <LayerPanel
          show={showLayerSelector}
          currentLayer={currentLayer}
          onLayerChange={handleLayerChange}
          onClose={() => setShowLayerSelector(false)}
        />

        <Toolbars
          show={showDrawingTools}
          selectedTool={selectedTool}
          onToolSelect={(toolId) => {
            handleToolSelect(toolId);
          }}
          onRemoveSelected={() => {
            if (selectedShape) {
              handleDeleteShape();
            }
          }}
          onImportKML={handleFileImport}
          hasSelectedShape={!!selectedShape}
          onClose={() => setShowDrawingTools(false)}
        />

        {/* Drawing Confirmation Dialog */}
        {showDrawingConfirm && pendingDrawing && <div className="absolute inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
            <Card className="bg-card border border-border shadow-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Confirmar Desenho</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="field-name" className="text-sm font-medium text-foreground">
                      Nome do Talhão
                    </Label>
                    <Input id="field-name" placeholder="Ex: Talhão 01 - Soja" value={confirmFormData.fieldName} onChange={e => setConfirmFormData(prev => ({
                  ...prev,
                  fieldName: e.target.value
                }))} className="mt-1" />
                  </div>

                  {isConsultor && <div>
                      <Label className="text-sm font-medium text-foreground">
                        Produtor
                      </Label>
                      <Select value={confirmFormData.selectedProducerId} onValueChange={value => setConfirmFormData(prev => ({
                  ...prev,
                  selectedProducerId: value,
                  selectedFarmId: value
                }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione o produtor" />
                        </SelectTrigger>
                        <SelectContent>
                          {linkedProducers.map(producer => <SelectItem key={producer.id} value={producer.id}>
                              {producer.name} - {producer.farm}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>}

                  {pendingDrawing.areaHa && <div className="bg-accent/50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-foreground">Área Calculada</div>
                      <div className="text-lg font-bold text-primary">
                        {pendingDrawing.areaHa} ha
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({pendingDrawing.areaM2?.toFixed(0)} m²)
                      </div>
                    </div>}
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button onClick={handleCancelDrawing} variant="outline" className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handleConfirmDrawing} className="flex-1" disabled={!confirmFormData.fieldName.trim()}>
                    Salvar
                  </Button>
                </div>
              </div>
            </Card>
          </div>}

        {/* Event Form Dialog */}
        {showEventForm && capturedPhoto && <div className="absolute inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
            <Card className="bg-card border border-border shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Registrar Evento</h3>
                
                <div className="space-y-4">
                  {/* Photo Preview */}
                  <div className="aspect-video bg-accent rounded-lg flex items-center justify-center">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </div>

                  {/* Event Type */}
                  <div>
                    <Label className="text-sm font-medium text-foreground">Tipo de Evento</Label>
                    <Select value={eventFormData.eventType} onValueChange={(value: any) => setEventFormData(prev => ({
                  ...prev,
                  eventType: value
                }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map(type => <SelectItem key={type.id} value={type.id}>
                            {type.emoji} {type.name}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <Label htmlFor="quantity" className="text-sm font-medium text-foreground">
                      Quantidade (opcional)
                    </Label>
                    <Input id="quantity" type="number" placeholder="Ex: 5" value={eventFormData.quantity} onChange={e => setEventFormData(prev => ({
                  ...prev,
                  quantity: e.target.value
                }))} className="mt-1" />
                  </div>

                  {/* Severity */}
                  <div>
                    <Label className="text-sm font-medium text-foreground">Severidade</Label>
                    <Select value={eventFormData.severity} onValueChange={(value: any) => setEventFormData(prev => ({
                  ...prev,
                  severity: value
                }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixo">🟢 Baixo</SelectItem>
                        <SelectItem value="medio">🟡 Médio</SelectItem>
                        <SelectItem value="alto">🔴 Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium text-foreground">
                      Observações (opcional)
                    </Label>
                    <Input id="notes" placeholder="Ex: Encontrado na bordadura" value={eventFormData.notes} onChange={e => setEventFormData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))} className="mt-1" />
                  </div>

                  {/* Location */}
                  <div className="bg-accent/50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-foreground">Localização</div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {eventFormData.latitude.toFixed(6)}, {eventFormData.longitude.toFixed(6)}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button onClick={() => {
                setShowEventForm(false);
                setCapturedPhoto(null);
              }} variant="outline" className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handleEventFormSubmit} className="flex-1">
                    Salvar Registro
                  </Button>
                </div>
              </div>
            </Card>
          </div>}

        <RouteUI
          farmId={selectedProducer?.id || ownFarm?.id || ''}
          farmName={selectedProducer?.farm || ownFarm?.name || ''}
          showRouteRecorder={showRouteRecorder}
          onTrailUpdate={(t) => { setCurrentTrail(t); setIsRecordingTrail(true); setShowRouteRecorder(true); updateLiveRouteVisualization(t); }}
          onTrailComplete={handleRouteComplete}
          showRouteHistory={showRouteHistory}
          closeRouteHistory={() => setShowRouteHistory(false)}
          onViewRoute={handleViewRoute}
          selectedViewTrail={selectedViewTrail}
          showRouteViewer={showRouteViewer}
          closeRouteViewer={() => { setShowRouteViewer(false); setSelectedViewTrail(null); }}
          photos={fieldPhotos.filter(photo => selectedViewTrail && photo.notes?.includes(selectedViewTrail.id))}
        />

        {/* Backdrop for closing menus */}
        {(showLayerSelector || showDrawingTools || showCameraEventSelector || showEventForm || showStageEditor) && <div className="absolute inset-0 z-20" onClick={() => {
        setShowLayerSelector(false);
        setShowDrawingTools(false);
        setShowCameraEventSelector(false);
        setShowEventForm(false);
        setShowStageEditor(false);
      }} />}
      </div>
    </>;
};
export default TechnicalMap;