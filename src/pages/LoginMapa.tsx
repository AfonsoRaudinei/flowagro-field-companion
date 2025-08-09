import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Map } from 'maplibre-gl';
import { Plus, Minus, Navigation, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CompassDialIcon from '@/components/icons/CompassDialIcon';
import MapCore from '@/components/map/MapCore';

const DEFAULT_CENTER: [number, number] = [-47.8825, -15.7942];
const DEFAULT_ZOOM = 12;

const LoginMapa: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<Map | null>(null);
  const [bearing, setBearing] = useState(0);

  // Ensure MapTiler key exists and set basic SEO
  useEffect(() => {
    document.title = 'Mapa de Acesso | FlowAgro';
    const desc = 'Mapa de acesso com zoom, recentrar e bússola.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = desc;

    if (typeof window !== 'undefined' && !localStorage.getItem('MAPTILER_API_KEY')) {
      localStorage.setItem('MAPTILER_API_KEY', 'TomRDHESnrtpittgnpuf');
    }
  }, []);

  const handleZoomIn = useCallback(() => mapRef.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => mapRef.current?.zoomOut(), []);
  const handleRecenter = useCallback(() => {
    mapRef.current?.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, essential: true });
  }, []);
  const handleResetBearing = useCallback(() => {
    mapRef.current?.easeTo({ bearing: 0, duration: 500 });
  }, []);

  return (
    <div className="relative w-full h-screen bg-background">
      {/* Top bar with back and title */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border border-border bg-card/70 backdrop-blur-sm shadow-ios-md"
          aria-label="Voltar"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Button>
        <h1 className="text-base font-semibold text-foreground">Mapa de Acesso</h1>
      </header>

      {/* Fullscreen Map */}
      <MapCore
        className="absolute inset-0"
        initialCenter={DEFAULT_CENTER}
        initialZoom={DEFAULT_ZOOM}
        styleId="satellite"
        onMapReady={(map) => {
          mapRef.current = map;
        }}
        onBearingChange={(b) => setBearing(b)}
      />

      {/* Floating Controls - Right Stack */}
      <aside className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col space-y-3">
        <Button onClick={handleZoomIn} variant="ghost" className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border">
          <Plus className="h-5 w-5 text-foreground" />
        </Button>
        <Button onClick={handleZoomOut} variant="ghost" className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border">
          <Minus className="h-5 w-5 text-foreground" />
        </Button>
        <Button onClick={handleRecenter} variant="ghost" className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border">
          <Navigation className="h-5 w-5 text-foreground" />
        </Button>
        <Button onClick={handleResetBearing} variant="ghost" className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border" aria-label="Resetar orientação">
          <CompassDialIcon bearing={bearing} className="h-5 w-5 text-foreground" />
        </Button>
      </aside>
    </div>
  );
};

export default LoginMapa;
