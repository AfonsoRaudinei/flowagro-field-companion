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
}

export const SimpleBaseMap: React.FC<SimpleBaseMapProps> = ({
  className,
  center = [-15.7975, -47.8919], // Brasília
  zoom = 4,
  style
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('Inicializando mapa...');

  const updateDebug = (message: string) => {
    setDebugInfo(prev => `${prev}\n${new Date().toLocaleTimeString()}: ${message}`);
    console.log('SimpleBaseMap:', message);
  };

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainer.current) return;

      try {
        setIsLoading(true);
        setError(null);
        updateDebug('Iniciando configuração do mapa...');

        // Primeiro, tentar buscar o token MapTiler
        let mapTilerToken: string | null = null;
        
        try {
          updateDebug('Buscando token MapTiler...');
          const { data, error: tokenError } = await supabase.functions.invoke('maptiler-token');
          
          if (tokenError) {
            updateDebug(`Erro ao buscar token: ${tokenError.message}`);
          } else if (data?.key) {
            mapTilerToken = data.key;
            updateDebug('Token MapTiler obtido com sucesso');
          } else {
            updateDebug('Token MapTiler não configurado, usando fallback OSM');
          }
        } catch (tokenErr) {
          updateDebug(`Falha na busca do token: ${tokenErr}`);
        }

        // Configurar estilo do mapa
        let mapStyle: string;
        
        if (mapTilerToken) {
          // Usar MapTiler se token disponível
          mapStyle = `https://api.maptiler.com/maps/streets/style.json?key=${mapTilerToken}`;
          updateDebug('Usando estilo MapTiler');
        } else {
          // Fallback para OpenStreetMap
          mapStyle = JSON.stringify({
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
          });
          updateDebug('Usando fallback OpenStreetMap');
        }

        // Criar instância do mapa
        updateDebug('Criando instância Mapbox GL...');
        const mapInstance = new mapboxgl.Map({
          container: mapContainer.current,
          style: mapStyle,
          center,
          zoom,
          pitch: 0,
          bearing: 0,
          interactive: true,
          attributionControl: false,
          preserveDrawingBuffer: true,
          failIfMajorPerformanceCaveat: false
        });

        updateDebug('Instância criada, aguardando carregamento...');

        // Adicionar controles básicos
        mapInstance.addControl(
          new mapboxgl.NavigationControl({
            visualizePitch: true,
            showZoom: true,
            showCompass: true
          }), 
          'top-right'
        );

        mapInstance.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
          }), 
          'top-right'
        );

        mapInstance.addControl(
          new mapboxgl.AttributionControl({ compact: true }), 
          'bottom-right'
        );

        // Event listeners
        mapInstance.on('load', () => {
          updateDebug('✅ Mapa carregado com sucesso!');
          setIsLoading(false);
        });

        mapInstance.on('error', (e) => {
          const errorMsg = `Erro do mapa: ${e.error?.message || 'Erro desconhecido'}`;
          updateDebug(`❌ ${errorMsg}`);
          setError(errorMsg);
          setIsLoading(false);
        });

        mapInstance.on('styledata', () => {
          updateDebug('Estilo do mapa carregado');
        });

        mapInstance.on('sourcedata', (e) => {
          if (e.isSourceLoaded) {
            updateDebug(`Fonte carregada: ${e.sourceId}`);
          }
        });

        map.current = mapInstance;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Falha na inicialização';
        updateDebug(`❌ Erro crítico: ${errorMsg}`);
        setError(errorMsg);
        setIsLoading(false);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, zoom]);

  const handleRetry = () => {
    setError(null);
    setDebugInfo('Reiniciando mapa...');
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
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
      
      {/* Debug info (removível em produção) */}
      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded max-w-xs max-h-32 overflow-y-auto font-mono z-40">
        <div className="whitespace-pre-wrap">{debugInfo}</div>
      </div>
    </div>
  );
};