import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CompassDialIcon from '@/components/icons/CompassDialIcon';
import MapCore, { maplibregl } from '@/components/map/MapCore';
const LoginMapa: React.FC = () => {
  const navigate = useNavigate();
  const [bearing, setBearing] = useState(0);
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  const handleMapLoad = (mapInstance: maplibregl.Map) => {
    setMap(mapInstance);

    // Add marketing pins
    const marketingPins = [{
      lng: -47.8825,
      lat: -15.7942,
      title: 'Campo Principal',
      description: 'Área de demonstração técnica'
    }, {
      lng: -47.8735,
      lat: -15.7852,
      title: 'Zona Experimental',
      description: 'Testes de agricultura de precisão'
    }, {
      lng: -47.8915,
      lat: -15.8032,
      title: 'Centro de Análise',
      description: 'Laboratório de solo e plantas'
    }, {
      lng: -47.8645,
      lat: -15.7762,
      title: 'Estação Meteorológica',
      description: 'Monitoramento climático'
    }];

    marketingPins.forEach((pin) => {
      const popup = new maplibregl.Popup({
        offset: 25,
        className: 'agricultural-popup'
      }).setHTML(`
        <div class="p-2 bg-card rounded-lg shadow-lg border border-border">
          <h3 class="font-semibold text-sm text-foreground">${pin.title}</h3>
          <p class="text-xs text-muted-foreground mt-1">${pin.description}</p>
        </div>
      `);

      new maplibregl.Marker({
        color: '#16a34a',
        scale: 0.8
      }).setLngLat([pin.lng, pin.lat]).setPopup(popup).addTo(mapInstance);
    });
  };

  const handleMapRotate = () => {
    if (map) {
      setBearing(map.getBearing());
    }
  };

  const handleZoomIn = () => map?.zoomIn();
  const handleZoomOut = () => map?.zoomOut();
  const handleRecenter = () => {
    map?.flyTo({
      center: [-47.8825, -15.7942],
      zoom: 12,
      essential: true
    });
  };
  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Map Container */}
      <MapCore
        options={{
          center: [-47.8825, -15.7942],
          zoom: 12,
          pitch: 0,
          bearing: 0,
          style: 'satellite'
        }}
        onMapLoad={handleMapLoad}
        onMapRotate={handleMapRotate}
        className="absolute inset-0"
      />

      {/* Compass */}
      <div className="absolute top-4 right-4 z-10">
        <div onClick={() => map?.easeTo({ bearing: 0, duration: 500 })} className="cursor-pointer backdrop-blur-sm p-3 rounded-full shadow-ios-md bg-card/80 border border-border">
          <CompassDialIcon bearing={bearing} className="h-6 w-6 text-foreground" />
        </div>
      </div>

      {/* Floating Controls - Right Side */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 flex flex-col space-y-3">
        <Button onClick={handleZoomIn} className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md hover:bg-card border border-border" variant="ghost">
          <Plus className="h-5 w-5 text-foreground" />
        </Button>
        
        <Button onClick={handleZoomOut} className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md hover:bg-card border border-border" variant="ghost">
          <Minus className="h-5 w-5 text-foreground" />
        </Button>
        
        <Button onClick={handleRecenter} className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md hover:bg-card border border-border" variant="ghost">
          <Navigation className="h-5 w-5 text-foreground" />
        </Button>
      </div>

      {/* FlowAgro Button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <Button onClick={() => navigate('/login-form')} className="px-8 py-4 bg-success text-white rounded-full shadow-ios-button font-semibold text-lg hover:bg-success/90 transition-all">
          FlowAgro
        </Button>
      </div>
    </div>
  );
};
export default LoginMapa;