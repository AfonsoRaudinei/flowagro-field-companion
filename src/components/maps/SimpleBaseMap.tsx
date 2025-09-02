import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SimpleBaseMapProps {
  className?: string;
  center?: [number, number];
  zoom?: number;
  style?: React.CSSProperties;
  showNativeControls?: boolean;
}

export const SimpleBaseMap: React.FC<SimpleBaseMapProps> = ({
  className,
  center = [-15.7975, -47.8919], // Brasília
  zoom = 4,
  style,
  showNativeControls = true
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const initializeMap = async () => {
      if (!mapContainer.current || map.current) return;
      
      console.log('SimpleBaseMap: Iniciando configuração do mapa...');
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('SimpleBaseMap: Buscando token MapTiler...');
        const { data, error: tokenError } = await supabase.functions.invoke('maptiler-token');
        
        if (!isMounted) return;
        
        let token = null;
        if (tokenError) {
          console.log('SimpleBaseMap: Erro ao buscar token:', tokenError.message);
        } else if (data?.key) {
          token = data.key;
          console.log('SimpleBaseMap: Token MapTiler obtido com sucesso');
        } else {
          console.log('SimpleBaseMap: Token não encontrado, usando OpenStreetMap');
        }
        
        console.log('SimpleBaseMap: Criando instância Mapbox GL...');
        const mapInstance = new mapboxgl.Map({
          container: mapContainer.current,
          style: token ? 
            `https://api.maptiler.com/maps/satellite/style.json?key=${token}` : 
            JSON.stringify({
              version: 8,
              name: "OpenStreetMap",
              sources: {
                osm: {
                  type: "raster",
                  tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                  tileSize: 256,
                  attribution: "© OpenStreetMap contributors"
                }
              },
              layers: [
                {
                  id: "osm-layer",
                  type: "raster",
                  source: "osm"
                }
              ]
            }),
          center: center || [-15.7975, -47.8919],
          zoom: zoom || 4,
          accessToken: token || undefined,
        });
        
        console.log('SimpleBaseMap: Instância criada, aguardando carregamento...');
        
        // Add controls conditionally
        if (showNativeControls) {
          mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
          mapInstance.addControl(new mapboxgl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
          }), 'top-right');
        }
        // Attribution is always required
        mapInstance.addControl(new mapboxgl.AttributionControl(), 'bottom-right');
        
        // Event listeners
        mapInstance.on('load', () => {
          if (!isMounted) return;
          console.log('SimpleBaseMap: Mapa carregado completamente');
          setIsLoading(false);
        });
        
        mapInstance.on('error', (e) => {
          if (!isMounted) return;
          console.error('SimpleBaseMap: Erro no mapa:', e);
          setError(`Erro ao carregar o mapa: ${e.error?.message || 'Erro desconhecido'}`);
          setIsLoading(false);
        });
        
        if (isMounted) {
          map.current = mapInstance;
        }
        
      } catch (err) {
        if (!isMounted) return;
        console.error('SimpleBaseMap: Erro na inicialização:', err);
        setError(`Erro na inicialização do mapa: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        setIsLoading(false);
      }
    };
    
    initializeMap();
    
    return () => {
      isMounted = false;
      if (map.current) {
        console.log('SimpleBaseMap: Limpando instância do mapa');
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const handleRetry = () => {
    setError(null);
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    // Re-trigger initialization
    window.location.reload();
  };

  return (
    <div className={cn("relative w-full h-full", className)} style={style}>
      {/* Mapa */}
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg overflow-hidden"
      />
      
      {/* Status overlay */}
      {(isLoading || error) && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md">
            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                <span>Carregando mapa...</span>
              </div>
            )}
            
            {error && (
              <div className="text-center">
                <div className="text-destructive mb-3">❌ {error}</div>
                <button 
                  onClick={handleRetry}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};