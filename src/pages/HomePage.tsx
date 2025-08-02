import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Plus, Minus, Navigation, MessageCircle, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Localizando...');

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with satellite view
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'satellite': {
            type: 'raster',
            tiles: [
              'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=YOUR_MAPTILER_KEY'
            ],
            tileSize: 256,
            attribution: '© MapTiler © OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'satellite',
            type: 'raster',
            source: 'satellite'
          }
        ]
      },
      center: [-47.8825, -15.7942], // Brasília coordinates
      zoom: 12,
      pitch: 0,
      bearing: 0
    });

    // Add marketing pins
    const marketingPins = [
      { lng: -47.8825, lat: -15.7942, title: 'Campo Principal', description: 'Área de demonstração técnica' },
      { lng: -47.8735, lat: -15.7852, title: 'Zona Experimental', description: 'Testes de agricultura de precisão' },
      { lng: -47.8915, lat: -15.8032, title: 'Centro de Análise', description: 'Laboratório de solo e plantas' },
      { lng: -47.8645, lat: -15.7762, title: 'Estação Meteorológica', description: 'Monitoramento climático' }
    ];

    map.current.on('load', () => {
      setMapLoaded(true);
      setStatusMessage('');

      // Add marketing pins
      marketingPins.forEach((pin, index) => {
        // Create popup
        const popup = new maplibregl.Popup({ 
          offset: 25,
          className: 'agricultural-popup'
        }).setHTML(`
          <div class="p-2 bg-card rounded-lg shadow-lg border border-border">
            <h3 class="font-semibold text-sm text-foreground">${pin.title}</h3>
            <p class="text-xs text-muted-foreground mt-1">${pin.description}</p>
          </div>
        `);

        // Create marker
        const marker = new maplibregl.Marker({
          color: '#16a34a',
          scale: 0.8
        })
          .setLngLat([pin.lng, pin.lat])
          .setPopup(popup)
          .addTo(map.current!);
      });
    });

    map.current.on('error', () => {
      setStatusMessage('Erro de GPS');
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  const handleZoomIn = () => {
    map.current?.zoomIn();
  };

  const handleZoomOut = () => {
    map.current?.zoomOut();
  };

  const handleRecenter = () => {
    setStatusMessage('Localizando...');
    map.current?.flyTo({
      center: [-47.8825, -15.7942],
      zoom: 12,
      essential: true
    });
    setTimeout(() => setStatusMessage(''), 1500);
  };

  const handleChat = () => {
    // Chat functionality will be implemented later
    console.log('Chat button clicked');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Status Message */}
      {statusMessage && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-ios-md">
            <p className="text-sm text-foreground font-medium">{statusMessage}</p>
          </div>
        </div>
      )}

      {/* Compass */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-card/90 backdrop-blur-sm p-3 rounded-full shadow-ios-md">
          <Compass className="h-6 w-6 text-foreground" />
        </div>
      </div>

      {/* Floating Controls - Right Side */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 flex flex-col space-y-3">
        <Button
          onClick={handleZoomIn}
          className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md hover:bg-card border border-border"
          variant="ghost"
        >
          <Plus className="h-5 w-5 text-foreground" />
        </Button>
        
        <Button
          onClick={handleZoomOut}
          className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md hover:bg-card border border-border"
          variant="ghost"
        >
          <Minus className="h-5 w-5 text-foreground" />
        </Button>
        
        <Button
          onClick={handleRecenter}
          className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md hover:bg-card border border-border"
          variant="ghost"
        >
          <Navigation className="h-5 w-5 text-foreground" />
        </Button>
        
        <Button
          onClick={handleChat}
          className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md hover:bg-card border border-border"
          variant="ghost"
        >
          <MessageCircle className="h-5 w-5 text-foreground" />
        </Button>
      </div>

      {/* FlowAgro Button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <Button
          onClick={() => navigate('/login-form')}
          className="px-8 py-4 bg-success text-white rounded-full shadow-ios-button font-semibold text-lg hover:bg-success/90 transition-all"
        >
          FlowAgro
        </Button>
      </div>
    </div>
  );
};

export default HomePage;