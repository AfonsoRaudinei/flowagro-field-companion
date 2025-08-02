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
  ChevronDown,
  Square,
  Circle,
  Pentagon,
  Route,
  Play,
  StopCircle,
  MessageCircle,
  Settings,
  Plus,
  Minus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CameraService, eventTypes, FieldPhoto } from '@/services/cameraService';
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
  const [isRecording, setIsRecording] = useState(false);
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
    setCurrentLayer(layerId);
    setShowLayerSelector(false);
    // Layer switching logic would go here
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
    
    // Show confirmation toast
    const toolNames = {
      freehand: 'Mão livre',
      polygon: 'Polígono', 
      pivot: 'Pivô',
      rectangle: 'Retângulo'
    };
    
    toast({
      title: "Ferramenta de desenho ativada",
      description: `${toolNames[toolId as keyof typeof toolNames]} - ${targetFarm.farm}`
    });

    // Simulate drawing completion after 3 seconds (replace with actual drawing logic)
    setTimeout(() => {
      saveDrawing(toolId, targetFarm);
    }, 3000);
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
        timestamp: new Date()
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

  const handleZoomIn = () => {
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

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    const targetFarm = isConsultor ? selectedProducer : ownFarm;
    console.log('GPS tracking:', !isRecording ? 'started' : 'stopped', 'for farm:', targetFarm?.farm);
  };

  const handleBack = () => {
    // Navigation logic would go here
    navigate('/login-form');
  };

  return (
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
          <div className="bg-card/90 backdrop-blur-sm p-3 rounded-full shadow-ios-md">
            <Compass className="h-5 w-5 text-foreground" />
          </div>
        </div>
      </div>

      {/* Sync Indicator */}
      <SyncIndicator className="absolute top-4 right-4 z-20" />

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

      {/* Layer Selector */}
      <div className="absolute top-20 left-4 z-10">
        <div className="relative">
          <Button
            onClick={() => setShowLayerSelector(!showLayerSelector)}
            className="flex items-center space-x-2 bg-card/90 backdrop-blur-sm shadow-ios-md border border-border"
            variant="ghost"
          >
            <Layers className="h-4 w-4" />
            <span className="text-sm">Camadas</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
          
          {showLayerSelector && (
            <Card className="absolute top-12 left-0 w-48 p-2 bg-card shadow-ios-lg border border-border z-50">
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

      {/* Drawing Tools */}
      <div className="absolute left-4 top-32 z-10">
        <div className="relative">
          <Button
            onClick={() => setShowDrawingTools(!showDrawingTools)}
            disabled={isDrawingMode}
            className={`flex items-center space-x-2 bg-card/90 backdrop-blur-sm shadow-ios-md border border-border ${
              isDrawingMode ? 'opacity-50' : ''
            }`}
            variant="ghost"
          >
            <Edit3 className="h-4 w-4" />
            <span className="text-sm">
              {isDrawingMode ? 'Desenhando...' : 'Desenhar'}
            </span>
          </Button>
          
          {showDrawingTools && (
            <Card className="absolute top-12 left-0 w-44 p-2 bg-card shadow-ios-lg border border-border z-50">
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

      {/* Import Button */}
      <div className="absolute left-4 top-44 z-10">
        <Button
          onClick={handleFileImport}
          className="flex items-center space-x-2 bg-card/90 backdrop-blur-sm shadow-ios-md border border-border"
          variant="ghost"
        >
          <Upload className="h-4 w-4" />
          <span className="text-sm">Importar</span>
        </Button>
      </div>

      {/* Right Side Controls */}
      <div className="absolute right-4 bottom-32 z-10 flex flex-col space-y-3">
        {/* Trail Recording Button */}
        <Button
          onClick={handleTrailToggle}
          className={`px-4 py-2 rounded-full backdrop-blur-sm shadow-ios-md border border-border ${
            isRecordingTrail 
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
              : 'bg-primary/90 hover:bg-primary text-primary-foreground'
          }`}
          variant="ghost"
          disabled={!isGPSEnabled}
        >
          <Route className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">
            {isRecordingTrail ? 'Parar Trilha' : 'Iniciar Trilha'}
          </span>
        </Button>

        {/* Camera with Event Selector */}
        <div className="relative">
          <Button
            onClick={() => setShowCameraEventSelector(!showCameraEventSelector)}
            className="w-14 h-14 rounded-full bg-primary/90 backdrop-blur-sm shadow-ios-md text-primary-foreground hover:bg-primary"
            variant="ghost"
          >
            <Camera className="h-6 w-6" />
          </Button>
          
          {showCameraEventSelector && (
            <Card className="absolute bottom-16 right-0 w-56 p-3 bg-card shadow-ios-lg border border-border z-50">
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

        {/* GPS Tracking */}
        <Button
          onClick={toggleRecording}
          className={`w-12 h-12 rounded-full backdrop-blur-sm shadow-ios-md border border-border ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-card/90 hover:bg-card'
          }`}
          variant="ghost"
        >
          {isRecording ? (
            <StopCircle className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 text-foreground" />
          )}
        </Button>

        {/* GPS Tracking Status */}
        <Button
          onClick={() => setShowDebugCoords(!showDebugCoords)}
          className={`w-12 h-12 rounded-full backdrop-blur-sm shadow-ios-md border border-border mb-3 ${
            showDebugCoords ? 'bg-accent' : 'bg-card/90 hover:bg-card'
          }`}
          variant="ghost"
        >
          <span className="text-xs font-bold">GPS</span>
        </Button>

        {/* Zoom Controls */}
        <div className="flex flex-col space-y-2 mb-3">
          <Button
            onClick={handleZoomIn}
            className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border"
            variant="ghost"
            size="icon"
          >
            <Plus className="h-5 w-5 text-foreground" />
          </Button>
          
          <Button
            onClick={handleZoomOut}
            className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border"
            variant="ghost"
            size="icon"
          >
            <Minus className="h-5 w-5 text-foreground" />
          </Button>
        </div>

        {/* GPS Recenter */}
        <Button
          onClick={handleGPSRecenter}
          className={`w-14 h-14 rounded-full backdrop-blur-sm shadow-ios-md border border-border ${
            isGPSEnabled && userLocation
              ? 'bg-primary/90 text-primary-foreground hover:bg-primary'
              : 'bg-card/90 hover:bg-card text-foreground'
          }`}
          variant="ghost"
        >
          <Navigation className="h-6 w-6" />
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

      {/* Backdrop for closing menus */}
      {(showLayerSelector || showDrawingTools || showCameraEventSelector) && (
        <div 
          className="absolute inset-0 z-20"
          onClick={() => {
            setShowLayerSelector(false);
            setShowDrawingTools(false);
            setShowCameraEventSelector(false);
          }}
        />
      )}
    </div>
  );
};

export default TechnicalMap;