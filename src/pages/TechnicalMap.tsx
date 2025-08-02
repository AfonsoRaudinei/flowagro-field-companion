import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  ArrowLeft, 
  Compass, 
  Layers, 
  Edit3, 
  Upload, 
  Camera, 
  Navigation, 
  Cloud,
  Square,
  Circle,
  Pentagon,
  Route,
  MessageCircle,
  Plus,
  Minus,
  Trash2
} from 'lucide-react';
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
import OfflineIndicator from '@/components/ui/offline-indicator';
import SyncIndicator from '@/components/ui/sync-indicator';
import ShapeEditControls from '@/components/ui/shape-edit-controls';
import { DrawingService, DrawingShape } from '@/services/drawingService';

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
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
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
  
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawings, setDrawings] = useState<DrawingMetadata[]>([]);
  const [fieldPhotos, setFieldPhotos] = useState<FieldPhoto[]>([]);
  const [showCameraEventSelector, setShowCameraEventSelector] = useState(false);
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
  const [previewFile, setPreviewFile] = useState<ImportedFile | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isGPSEnabled, setIsGPSEnabled] = useState(false);
  const [showDebugCoords, setShowDebugCoords] = useState(false);
  const [gpsWatchId, setGpsWatchId] = useState<string | null>(null);
  const [currentTrail, setCurrentTrail] = useState<Trail | null>(null);
  const [isRecordingTrail, setIsRecordingTrail] = useState(false);
  const [drawnShapes, setDrawnShapes] = useState<DrawingShape[]>([]);
  const [selectedShape, setSelectedShape] = useState<DrawingShape | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shapeToDelete, setShapeToDelete] = useState<DrawingShape | null>(null);
  const [editingShape, setEditingShape] = useState<DrawingShape | null>(null);
  const [pendingDrawing, setPendingDrawing] = useState<{shapeType: string, targetFarm: {id: string, farm: string}, areaM2?: number, areaHa?: number} | null>(null);
  const [showDrawingConfirm, setShowDrawingConfirm] = useState(false);
  const [confirmFormData, setConfirmFormData] = useState({
    selectedProducerId: '',
    selectedFarmId: '',
    fieldName: ''
  });

  const mapLayers = [
    { id: 'satellite', name: 'Satelite', style: 'satellite' },
    { id: 'hybrid', name: 'Híbrido', style: 'hybrid' },
    { id: 'terrain', name: 'Terreno', style: 'terrain' },
    { id: 'landscape', name: 'Paisagem', style: 'landscape' },
    { id: 'ndvi-sentinel', name: 'NDVI Sentinel', style: 'ndvi-sentinel' },
    { id: 'ndvi-planet', name: 'NDVI Planet', style: 'ndvi-planet' }
  ];

  const drawingTools = [
    { id: 'freehand', name: 'Mão livre', icon: Edit3 },
    { id: 'polygon', name: 'Polígono', icon: Pentagon },
    { id: 'pivot', name: 'Pivô', icon: Circle },
    { id: 'rectangle', name: 'Retângulo', icon: Square }
  ];

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

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with MapTiler
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'maptiler-satellite': {
            type: 'raster',
            tiles: [
              'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=TomRDHESnrtpittgnpuf'
            ],
            tileSize: 256,
            attribution: '© MapTiler © OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'satellite',
            type: 'raster',
            source: 'maptiler-satellite'
          }
        ]
      },
      center: [-52.0, -10.0], // Default center on Brazil
      zoom: 16,
      pitch: 0,
      bearing: 0
    });

    // Add map controls
    map.current.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: false
      }),
      'top-left'
    );

    // Add geolocate control
    const geolocateControl = new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    });

    map.current.addControl(geolocateControl, 'top-left');

    // Handle map load errors
    map.current.on('error', (e) => {
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
            geolocateControl.trigger();
          } catch (error) {
            console.log('GPS trigger failed, using default location');
          }
        }
      } catch (error) {
        console.log('Location unavailable, using default center');
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

    return () => {
      // Cleanup GPS watch
      if (gpsWatchId) {
        GPSService.clearWatch(gpsWatchId);
      }
      // Remove drawing listener
      DrawingService.removeListener(setDrawnShapes);
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
        setIsGPSEnabled(true);
        
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

  const handleLayerChange = (layerId: string) => {
    if (!map.current) return;
    
    setCurrentLayer(layerId);
    setShowLayerSelector(false);
    
    // Map layer sources for MapTiler
    const layerSources = {
      satellite: 'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=TomRDHESnrtpittgnpuf',
      terrain: 'https://api.maptiler.com/maps/terrain/{z}/{x}/{y}.png?key=TomRDHESnrtpittgnpuf',
      landscape: 'https://api.maptiler.com/maps/landscape/{z}/{x}/{y}.png?key=TomRDHESnrtpittgnpuf',
      hybrid: 'https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=TomRDHESnrtpittgnpuf',
      'ndvi-sentinel': 'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=TomRDHESnrtpittgnpuf',
      'ndvi-planet': 'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=TomRDHESnrtpittgnpuf'
    };
    
    try {
      // Remove existing layer and source
      if (map.current.getLayer('base-layer')) {
        map.current.removeLayer('base-layer');
      }
      if (map.current.getSource('base-source')) {
        map.current.removeSource('base-source');
      }
      
      // Add new source and layer
      map.current.addSource('base-source', {
        type: 'raster',
        tiles: [layerSources[layerId as keyof typeof layerSources]],
        tileSize: 256,
        attribution: '© MapTiler © OpenStreetMap contributors'
      });
      
      map.current.addLayer({
        id: 'base-layer',
        type: 'raster',
        source: 'base-source'
      });
      
      toast({
        title: "Camada alterada",
        description: `Visualizando: ${mapLayers.find(l => l.id === layerId)?.name}`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error switching layer:', error);
      toast({
        title: "Erro ao trocar camada",
        description: "Não foi possível alterar a visualização",
        variant: "destructive"
      });
    }
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
    setShowDrawingTools(false);
    setIsDrawingMode(true);
    
    // Add visual feedback to map container
    if (mapContainer.current) {
      mapContainer.current.style.cursor = 'crosshair';
      mapContainer.current.classList.add('drawing-active');
    }
    
    // Show confirmation toast with visual feedback
    const toolNames = {
      freehand: 'Mão livre',
      polygon: 'Polígono', 
      pivot: 'Pivô',
      rectangle: 'Retângulo'
    };
    
    toast({
      title: "🎯 Ferramenta ativada",
      description: `${toolNames[toolId as keyof typeof toolNames]} - Toque no mapa para começar`,
      variant: "default"
    });

    // Add click listener for drawing
    const handleMapDrawClick = (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Simulate drawing start
      setTimeout(() => {
        // Remove drawing mode styling
        if (mapContainer.current) {
          mapContainer.current.style.cursor = 'default';
          mapContainer.current.classList.remove('drawing-active');
        }
        
        // Initialize form data when showing confirmation
        const defaultProducerId = isProdutor ? ownFarm?.id || '' : selectedProducer?.id || '';
        const defaultFarmId = isProdutor ? ownFarm?.id || '' : selectedProducer?.id || '';
        
        setConfirmFormData({
          selectedProducerId: defaultProducerId,
          selectedFarmId: defaultFarmId,
          fieldName: ''
        });
        
        // Calculate mock area (in a real implementation, this would use actual drawing coordinates)
        const mockArea = Math.random() * 50000 + 10000; // Mock area between 1-5 hectares
        const areaHa = Math.round(mockArea / 10000 * 100) / 100;
        
        setPendingDrawing({ 
          shapeType: toolId, 
          targetFarm,
          areaM2: mockArea,
          areaHa: areaHa
        });
        setShowDrawingConfirm(true);
        setIsDrawingMode(false);
        
        // Remove click listener
        mapContainer.current?.removeEventListener('click', handleMapDrawClick);
        
        toast({
          title: "✅ Desenho concluído",
          description: "Configure os dados da área abaixo",
          variant: "default"
        });
      }, 2000);
    };

    // Add click listener to map container
    mapContainer.current?.addEventListener('click', handleMapDrawClick);
  };

  const saveDrawing = async (shapeType: string, targetFarm: { id: string; farm: string }) => {
    const newDrawing: DrawingShape = {
      id: `drawing-${Date.now()}`,
      farmId: targetFarm.id,
      farmName: targetFarm.farm,
      shapeType: shapeType as any,
      points: [
        // Mock points - would be actual drawing coordinates
        { x: 100, y: 100, lat: -15.7942, lng: -47.8825 },
        { x: 200, y: 100, lat: -15.7940, lng: -47.8820 },
        { x: 200, y: 200, lat: -15.7938, lng: -47.8820 },
        { x: 100, y: 200, lat: -15.7938, lng: -47.8825 }
      ],
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
    const canEdit = targetFarm && DrawingService.canEdit(
      shape, 
      targetFarm.id, 
      isConsultor, 
      selectedProducer?.id
    );

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
      
      const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
    if (map.current) {
      map.current.zoomIn({ duration: 300 });
    }
  };

  const handleZoomOut = () => {
    if (map.current) {
      map.current.zoomOut({ duration: 300 });
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
        const trail = await TrailService.startTrailRecording(
          targetFarm.id,
          targetFarm.farm,
          (updatedTrail) => {
            setCurrentTrail(updatedTrail);
            // Could update map here with new points
          }
        );
        
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

      const importedFile = await FileImportService.saveImportedFile(
        file, 
        targetFarm.id, 
        targetFarm.farm
      );

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

  const handleCameraOpen = (eventType: string) => {
    handleCameraEventSelect(eventType);
  };


  const handleConfirmDrawing = async () => {
    if (pendingDrawing && confirmFormData.fieldName.trim()) {
      // Get selected producer/farm info
      const selectedProducerInfo = isConsultor 
        ? linkedProducers.find(p => p.id === confirmFormData.selectedProducerId)
        : ownFarm;

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
          { x: 100, y: 100, lat: -15.7942, lng: -47.8825 },
          { x: 200, y: 100, lat: -15.7940, lng: -47.8820 },
          { x: 200, y: 200, lat: -15.7938, lng: -47.8820 },
          { x: 100, y: 200, lat: -15.7938, lng: -47.8825 }
        ],
        timestamp: new Date(),
        areaM2: pendingDrawing.areaM2,
        areaHa: pendingDrawing.areaHa
      };

      await DrawingService.saveDrawing(newDrawing);
      
      // Reset form and state
      setPendingDrawing(null);
      setShowDrawingConfirm(false);
      setSelectedTool('');
      setConfirmFormData({ selectedProducerId: '', selectedFarmId: '', fieldName: '' });

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
    setConfirmFormData({ selectedProducerId: '', selectedFarmId: '', fieldName: '' });
    
    toast({
      title: "Desenho cancelado",
      description: "Área não foi salva",
      variant: "default"
    });
  };

  const handleBack = () => {
    // Navigation logic would go here
    navigate('/login-form');
  };

  return (
    <>
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
      <div 
        ref={mapContainer} 
        className="absolute inset-0" 
        onClick={handleMapClick}
      />
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border"
            variant="ghost"
            size="icon"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Button>
          
          {/* Producer Selector for Consultants */}
          {isConsultor && (
            <div className="flex items-center space-x-2">
              <Select 
                value={selectedProducer?.id || ""} 
                onValueChange={(value) => {
                  const producer = linkedProducers.find(p => p.id === value);
                  setSelectedProducer(producer || null);
                }}
              >
                <SelectTrigger className="w-48 bg-card/90 backdrop-blur-sm shadow-ios-md border border-border">
                  <SelectValue placeholder="Selecionar produtor" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border shadow-lg z-50">
                  {linkedProducers.map((producer) => (
                    <SelectItem key={producer.id} value={producer.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{producer.name}</span>
                        <span className="text-xs text-muted-foreground">{producer.farm}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Farm Display for Producers */}
          {isProdutor && ownFarm && (
            <Card className="px-3 py-2 bg-card/90 backdrop-blur-sm shadow-ios-md">
              <span className="text-sm font-medium text-foreground">{ownFarm.farm}</span>
            </Card>
          )}

          {/* Plot Info */}
          {selectedPlot && (isConsultor ? selectedProducer : isProdutor) && (
            <Card className="px-3 py-2 bg-card/90 backdrop-blur-sm shadow-ios-md">
              <span className="text-sm font-medium text-foreground">{selectedPlot}</span>
            </Card>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <SyncIndicator className="z-20" />
          <div className="bg-card/90 backdrop-blur-sm p-3 rounded-full shadow-ios-md">
            <Compass className="h-5 w-5 text-foreground" />
          </div>
        </div>
      </div>

      {/* Weather Card */}
      <div className="absolute top-20 right-4 z-10">
        <Card className="p-3 bg-card/90 backdrop-blur-sm shadow-ios-md w-32">
          <div className="text-center space-y-2">
            <Cloud className="h-6 w-6 mx-auto text-primary mb-1" />
            <div className="text-xs font-medium text-foreground">25°C</div>
            <div className="text-xs text-muted-foreground">Ensolarado</div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 h-6 text-xs hover:bg-accent/50 w-full"
              onClick={() => {
                toast({
                  title: "Radar meteorológico",
                  description: "Radar meteorológico em desenvolvimento",
                  variant: "default"
                });
              }}
            >
              Radar
            </Button>
          </div>
        </Card>
      </div>

      {/* Layer Selector - Repositioned */}
      <div className="absolute top-20 left-4 z-10">
        <div className="relative">
          <Button
            onClick={() => setShowLayerSelector(!showLayerSelector)}
            className="w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border hover:bg-card"
            variant="ghost"
            size="icon"
            title="Camadas do mapa"
          >
            <Layers className="h-3 w-3" />
          </Button>
          
          {showLayerSelector && (
            <Card className="absolute top-0 left-10 w-48 p-2 bg-card shadow-ios-lg border border-border z-50">
              {mapLayers.map((layer) => (
                <Button
                  key={layer.id}
                  onClick={() => handleLayerChange(layer.id)}
                  variant="ghost"
                  className={`w-full justify-start text-sm mb-1 ${
                    currentLayer === layer.id ? 'bg-accent' : ''
                  }`}
                >
                  {layer.name}
                </Button>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* Drawing Tools - Optimized */}
      <div className="absolute left-4 top-32 z-10">
        <div className="relative">
          <Button
            onClick={() => setShowDrawingTools(!showDrawingTools)}
            disabled={isDrawingMode}
            className={`w-8 h-8 rounded-full backdrop-blur-sm shadow-ios-md border border-border hover:bg-card ${
              isDrawingMode ? 'bg-primary/20 border-primary animate-pulse' : 'bg-card/90'
            }`}
            variant="ghost"
            size="icon"
            title={isDrawingMode ? 'Desenhando...' : 'Ferramentas de desenho'}
          >
            <Edit3 className="h-3 w-3" />
          </Button>
          
          {showDrawingTools && (
            <Card className="absolute top-0 left-10 w-44 p-2 bg-card shadow-ios-lg border border-border z-50">
              {drawingTools.map((tool) => {
                const IconComponent = tool.icon;
                const isActive = selectedTool === tool.id;
                return (
                  <Button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    variant="ghost"
                    disabled={isDrawingMode}
                    className={`w-full justify-start text-sm mb-1 ${
                      isActive ? 'bg-accent' : ''
                    } ${isDrawingMode ? 'opacity-50' : ''}`}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {tool.name}
                    {isActive && isDrawingMode && (
                      <span className="ml-auto text-xs text-primary">Ativo</span>
                    )}
                  </Button>
                );
              })}
              {isDrawingMode && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Desenhe no mapa...
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Import Button - Optimized */}
      <div className="absolute left-4 top-44 z-10">
        <Button
          onClick={handleFileImport}
          className="w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border hover:bg-card"
          variant="ghost"
          size="icon"
          title="Importar arquivo KML/KMZ"
        >
          <Upload className="h-3 w-3" />
        </Button>
      </div>

      {/* Optimized Right Side Controls - Single Column */}
      <div className="absolute right-4 bottom-4 z-10 flex flex-col space-y-3">
        {/* GPS Recenter */}
        <Button
          onClick={handleGPSRecenter}
          className={`w-8 h-8 rounded-full backdrop-blur-sm shadow-ios-md border border-border ${
            isGPSEnabled && userLocation
              ? 'bg-primary/90 text-primary-foreground hover:bg-primary'
              : 'bg-card/90 hover:bg-card text-foreground'
          }`}
          variant="ghost"
          size="icon"
          title="Recentralizar GPS"
        >
          <Navigation className="h-3 w-3" />
        </Button>

        {/* Zoom Controls */}
        <Button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border hover:bg-card"
          variant="ghost"
          size="icon"
          title="Aproximar"
        >
          <Plus className="h-3 w-3 text-foreground" />
        </Button>
        
        <Button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border hover:bg-card"
          variant="ghost"
          size="icon"
          title="Afastar"
        >
          <Minus className="h-3 w-3 text-foreground" />
        </Button>

        {/* GPS Debug Toggle */}
        <Button
          onClick={() => setShowDebugCoords(!showDebugCoords)}
          className={`w-8 h-8 rounded-full backdrop-blur-sm shadow-ios-md border border-border ${
            showDebugCoords ? 'bg-accent hover:bg-accent/80' : 'bg-card/90 hover:bg-card'
          }`}
          variant="ghost"
          size="icon"
          title="Mostrar coordenadas GPS"
        >
          <MessageCircle className="h-3 w-3 text-foreground" />
        </Button>

        {/* Camera with Event Selector */}
        <div className="relative">
          <Button
            onClick={() => handleCameraOpen()}
            className="w-8 h-8 rounded-full bg-green-500/90 backdrop-blur-sm shadow-ios-md border border-border hover:bg-green-600 text-white"
            variant="ghost"
            size="icon"
            title="Registrar evento de campo"
          >
            <Camera className="h-3 w-3" />
          </Button>
          
          {showCameraEventSelector && (
            <Card className="absolute bottom-10 right-0 w-56 p-3 bg-card shadow-ios-lg border border-border z-50">
              <div className="text-sm font-medium text-foreground mb-3 px-1">
                📸 Selecionar evento:
              </div>
              {eventTypes.map((event) => (
                <Button
                  key={event.id}
                  onClick={() => handleCameraEventSelect(event.id)}
                  variant="ghost"
                  className="w-full justify-start text-sm mb-2 hover:bg-accent"
                >
                  <div className={`w-3 h-3 rounded-full ${event.color} mr-3`} />
                  <span className="mr-2">{event.emoji}</span>
                  {event.name}
                </Button>
              ))}
            </Card>
          )}
        </div>

        {/* Trail Recording Button */}
        <Button
          onClick={handleTrailToggle}
          className={`w-8 h-8 rounded-full backdrop-blur-sm shadow-ios-md border border-border ${
            isRecordingTrail 
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
              : 'bg-card/90 hover:bg-card text-foreground'
          }`}
          variant="ghost"
          size="icon"
          disabled={!isGPSEnabled}
          title={isRecordingTrail ? 'Parar gravação de trilha' : 'Iniciar gravação de trilha'}
        >
          <Route className="h-3 w-3" />
        </Button>
      </div>

      {/* File Preview Overlay */}
      {previewFile && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center">
          <Card className="p-6 mx-4 bg-card shadow-ios-lg max-w-sm w-full">
            <div className="text-center">
              <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Arquivo Importado</h3>
              <p className="text-sm text-muted-foreground mb-1">
                📁 {previewFile.fileName}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                🏡 {previewFile.farmName}
              </p>
              
              {previewFile.boundingBox && (
                <div className="mb-4 p-3 bg-accent/20 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Área detectada:</p>
                  <p className="text-xs font-mono">
                    {previewFile.boundingBox.north.toFixed(4)}°N, {previewFile.boundingBox.west.toFixed(4)}°W
                  </p>
                </div>
              )}
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => setPreviewFile(null)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    // Center map on imported area if bounding box available
                    if (previewFile.boundingBox && map.current) {
                      const center = [
                        (previewFile.boundingBox.east + previewFile.boundingBox.west) / 2,
                        (previewFile.boundingBox.north + previewFile.boundingBox.south) / 2
                      ];
                      map.current.flyTo({ 
                        center: center as [number, number], 
                        zoom: 15,
                        duration: 1000
                      });
                    }
                    setPreviewFile(null);
                  }}
                  className="bg-primary text-primary-foreground flex-1"
                  size="sm"
                >
                  Ver no Mapa
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Legacy Import Preview - Remove this when above is working */}
      {importedFile && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center">
          <Card className="p-6 mx-4 bg-card shadow-ios-lg">
            <h3 className="font-semibold text-foreground mb-4">Arquivo importado (legacy)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {importedFile.name}
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={() => setImportedFile(null)}
                variant="outline"
                size="sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const targetFarm = isConsultor ? selectedProducer : ownFarm;
                  if (targetFarm) {
                    console.log('File associated with:', targetFarm.farm);
                    // Logic to save file for specific farm
                  }
                  setImportedFile(null);
                }}
                className="bg-success text-white"
                size="sm"
                disabled={isConsultor && !selectedProducer}
              >
                Associar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Trail Recording Status */}
      {isRecordingTrail && currentTrail && (
        <div className="absolute top-20 left-4 right-4 z-10">
          <Card className="p-3 bg-red-500/90 backdrop-blur-sm shadow-ios-md text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium">
                  Gravando trilha
                </span>
              </div>
              <div className="text-sm">
                {currentTrail.points.length > 0 && (
                  <>
                    {TrailService.formatDistance(currentTrail.totalDistance || 0)} • {TrailService.formatDuration(currentTrail.startTime)}
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* GPS Debug Coordinates */}
      {showDebugCoords && userLocation && (
        <div className="absolute bottom-20 left-4 z-10">
          <Card className="p-3 bg-card/95 backdrop-blur-sm shadow-ios-md border border-border">
            <div className="text-xs space-y-1">
              <p className="font-medium text-foreground">📍 Localização GPS</p>
              <p className="font-mono text-muted-foreground">
                {GPSService.formatCoordinates(userLocation.latitude, userLocation.longitude)}
              </p>
              <p className="text-muted-foreground">
                Precisão: {Math.round(userLocation.accuracy)}m
              </p>
              <p className="text-muted-foreground text-xs">
                {userLocation.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* GPS Status Indicator */}
      {isGPSEnabled && userLocation && (
        <div className="absolute top-52 right-4 z-10">
          <div className="w-3 h-3 bg-primary rounded-full shadow-lg animate-pulse" />
        </div>
      )}

      {/* Drawing Status Indicator */}
      {isDrawingMode && (
        <div className="absolute bottom-20 left-4 right-4 z-10">
          <Card className="p-3 bg-primary/90 backdrop-blur-sm shadow-ios-md text-primary-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium">
                  Modo de desenho ativo
                </span>
              </div>
              <Button
                onClick={() => {
                  setIsDrawingMode(false);
                  setSelectedTool('');
                  toast({
                    title: "Desenho cancelado",
                    variant: "default"
                  });
                }}
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-white/20"
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Drawn Shapes */}
      {drawnShapes.map((shape) => (
        <div
          key={shape.id}
          className={`absolute pointer-events-auto z-30 ${
            shape.isSelected ? 'ring-2 ring-primary ring-opacity-50' : ''
          }`}
          style={{
            // Mock positioning - would be calculated from actual coordinates
            left: shape.points[0]?.x || 0,
            top: shape.points[0]?.y || 0,
            width: 100,
            height: 100,
            backgroundColor: shape.color + '20',
            border: `2px solid ${shape.color}`,
            borderRadius: shape.shapeType === 'pivot' ? '50%' : '4px'
          }}
          onClick={(e) => handleShapeClick(shape, e)}
        />
      ))}

      {/* Shape Edit Controls */}
      {selectedShape && (
        <ShapeEditControls
          position={{ x: selectedShape.points[0]?.x || 0, y: selectedShape.points[0]?.y || 0 }}
          onEdit={handleEditShape}
          onDelete={handleDeleteShape}
          canEdit={true}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && shapeToDelete && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="p-6 mx-4 bg-card shadow-ios-lg max-w-sm w-full">
            <div className="text-center">
              <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Remover área</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Deseja remover esta área de <strong>{shapeToDelete.farmName}</strong>?
              </p>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setShapeToDelete(null);
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmDeleteShape}
                  className="bg-red-500 hover:bg-red-600 text-white flex-1"
                  size="sm"
                >
                  Remover
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Enhanced Drawing Confirmation Panel */}
      {showDrawingConfirm && pendingDrawing && (
        <div className="absolute bottom-0 left-0 right-0 z-40">
          <div className="bg-card/95 backdrop-blur-sm border-t border-border shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-foreground">
                  Configurar área desenhada
                </h3>
              </div>
              
              {/* Producer Selection (for consultants only) */}
              {isConsultor && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Produtor
                  </label>
                  <Select 
                    value={confirmFormData.selectedProducerId} 
                    onValueChange={(value) => {
                      setConfirmFormData(prev => ({
                        ...prev,
                        selectedProducerId: value,
                        selectedFarmId: value // Currently each producer has one farm
                      }));
                    }}
                  >
                    <SelectTrigger className="w-full bg-background border-border">
                      <SelectValue placeholder="Selecionar produtor" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border shadow-lg z-50">
                      {linkedProducers.map((producer) => (
                        <SelectItem key={producer.id} value={producer.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{producer.name}</span>
                            <span className="text-xs text-muted-foreground">{producer.farm}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Farm Display */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Fazenda
                </label>
                <div className="px-3 py-2 bg-accent/50 border border-border rounded-md">
                  <span className="text-sm text-foreground">
                    {isConsultor 
                      ? linkedProducers.find(p => p.id === confirmFormData.selectedProducerId)?.farm || 'Selecione um produtor'
                      : ownFarm?.farm || 'Fazenda não disponível'
                    }
                  </span>
                </div>
              </div>

              {/* Field Name Input */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Nome do Talhão *
                </label>
                <Input
                  value={confirmFormData.fieldName}
                  onChange={(e) => setConfirmFormData(prev => ({
                    ...prev,
                    fieldName: e.target.value
                  }))}
                  placeholder="Digite o nome do talhão..."
                  className="w-full bg-background border-border"
                />
              </div>

              {/* Area Display */}
              {pendingDrawing && pendingDrawing.areaHa && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Área: {pendingDrawing.areaHa} ha
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <Button
                  onClick={handleCancelDrawing}
                  variant="outline"
                  className="flex-1 py-2"
                >
                  ❌ Cancelar
                </Button>
                <Button
                  onClick={handleConfirmDrawing}
                  className="flex-1 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!confirmFormData.fieldName.trim() || (isConsultor && !confirmFormData.selectedProducerId)}
                >
                  ✅ Confirmar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Event Recording Form */}
      {showEventForm && capturedPhoto && (
        <div className="absolute bottom-0 left-0 right-0 z-50">
          <div className="bg-card/95 backdrop-blur-sm border-t border-border shadow-lg">
            <div className="px-4 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">
                  📸 Novo Registro de Campo
                </h3>
                <Button
                  onClick={() => {
                    setShowEventForm(false);
                    setCapturedPhoto(null);
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>

              {/* Event Type Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Tipo de Evento
                </Label>
                <Select
                  value={eventFormData.eventType}
                  onValueChange={(value) => setEventFormData(prev => ({
                    ...prev,
                    eventType: value as any
                  }))}
                >
                  <SelectTrigger className="w-full bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border shadow-lg z-50">
                    {eventTypes.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        <div className="flex items-center gap-2">
                          <span>{event.emoji}</span>
                          <span>{event.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity (for insect events) */}
              {(eventFormData.eventType === 'sugador' || eventFormData.eventType === 'mastigador') && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Quantidade de Insetos
                  </Label>
                  <Input
                    type="number"
                    value={eventFormData.quantity}
                    onChange={(e) => setEventFormData(prev => ({
                      ...prev,
                      quantity: e.target.value
                    }))}
                    placeholder="Ex: 5"
                    className="w-full bg-background border-border"
                  />
                </div>
              )}

              {/* Severity Level */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Nível de Severidade
                </Label>
                <Select
                  value={eventFormData.severity}
                  onValueChange={(value) => setEventFormData(prev => ({
                    ...prev,
                    severity: value as any
                  }))}
                >
                  <SelectTrigger className="w-full bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border shadow-lg z-50">
                    <SelectItem value="baixo">🟢 Baixo</SelectItem>
                    <SelectItem value="medio">🟡 Médio</SelectItem>
                    <SelectItem value="alto">🔴 Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location Display */}
              <div className="bg-accent/50 border border-border rounded-md p-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {eventFormData.latitude && eventFormData.longitude
                      ? `${eventFormData.latitude.toFixed(6)}, ${eventFormData.longitude.toFixed(6)}`
                      : 'Localização não disponível'
                    }
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Observações (opcional)
                </Label>
                <textarea
                  value={eventFormData.notes}
                  onChange={(e) => setEventFormData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  placeholder="Adicione observações sobre o evento..."
                  className="w-full min-h-[60px] px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <Button
                  onClick={() => {
                    setShowEventForm(false);
                    setCapturedPhoto(null);
                  }}
                  variant="outline"
                  className="flex-1 py-2"
                >
                  ❌ Cancelar
                </Button>
                <Button
                  onClick={handleEventFormSubmit}
                  className="flex-1 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  ✅ Salvar evento
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for closing menus */}
      {(showLayerSelector || showDrawingTools || showCameraEventSelector || showEventForm) && (
        <div 
          className="absolute inset-0 z-20"
          onClick={() => {
            setShowLayerSelector(false);
            setShowDrawingTools(false);
            setShowCameraEventSelector(false);
            setShowEventForm(false);
          }}
        />
      )}
    </div>
    </>
  );
};

export default TechnicalMap;