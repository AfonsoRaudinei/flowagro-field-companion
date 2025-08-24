import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Fix default marker icons for Vite bundling
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export type BaseLayerId = "streets" | "satellite" | "terrain";

export type MapMarker = {
  id: string;
  position: [number, number]; // [lat, lng]
  label?: string;
};

export type MapViewProps = {
  center?: [number, number];
  zoom?: number;
  baseLayerId?: BaseLayerId;
  markers?: MapMarker[];
  geojson?: GeoJSON.FeatureCollection;
  className?: string;
  mapChildren?: React.ReactNode; // inside MapContainer, has map context
  children?: React.ReactNode; // floating overlays
};

const MAPTILER_STYLES: Record<BaseLayerId, string> = {
  streets: "maps/streets-v2",
  satellite: "tiles/satellite",
  terrain: "maps/topo-v2",
};

function RecenterOnChange({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom ?? map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapView({
  center = [-23.55, -46.63],
  zoom = 5,
  baseLayerId = "streets",
  markers = [],
  geojson,
  className,
  mapChildren,
  children,
}: MapViewProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  // Cache MapTiler API key with 1 hour TTL
  const getCachedApiKey = (): string | null => {
    try {
      const cached = localStorage.getItem('maptiler_api_key_cache');
      if (cached) {
        const { key, expiresAt } = JSON.parse(cached);
        if (Date.now() < expiresAt) {
          return key;
        }
        localStorage.removeItem('maptiler_api_key_cache');
      }
    } catch {
      localStorage.removeItem('maptiler_api_key_cache');
    }
    return null;
  };

  const setCachedApiKey = (key: string) => {
    try {
      const cache = {
        key,
        expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour TTL
      };
      localStorage.setItem('maptiler_api_key_cache', JSON.stringify(cache));
    } catch {
      // Fail silently if localStorage is not available
    }
  };

  useEffect(() => {
    let active = true;

    const loadApiKey = async () => {
      // Try cached key first
      const cached = getCachedApiKey();
      if (cached) {
        setApiKey(cached);
        setError(null);
        return;
      }

      // Fetch fresh key
      try {
        const { data, error } = await supabase.functions.invoke("maptiler-token", { method: "GET" });
        if (!active) return;
        
        if (error) {
          setError("Não foi possível obter a chave do MapTiler.");
          setApiKey(null);
        } else {
          const key = (data as any)?.key || null;
          setApiKey(key);
          if (!key) {
            setError("Chave MAPTILER_API_KEY ausente nas Secrets do Supabase.");
          } else {
            setError(null);
            setCachedApiKey(key);
          }
        }
      } catch (e: any) {
        if (!active) return;
        setError("Erro ao buscar a chave do MapTiler.");
        setApiKey(null);
      }
    };

    loadApiKey();
    
    return () => {
      active = false;
    };
  }, [reload]);

  const tileUrl = useMemo(() => {
    const style = MAPTILER_STYLES[baseLayerId] || MAPTILER_STYLES.streets;
    return apiKey
      ? `https://api.maptiler.com/${style}/256/{z}/{x}/{y}.png?key=${apiKey}`
      : null;
  }, [apiKey, baseLayerId]);

  if (!tileUrl) {
    return (
      <div className={cn("relative w-full h-full flex items-center justify-center p-6", className)}>
        <div className="text-center space-y-3">
          <p className="text-foreground font-medium">Mapa indisponível — configure MAPTILER_API_KEY nas Edge Function Secrets do Supabase.</p>
          <div className="flex justify-center">
            <button
              onClick={() => setReload((c) => c + 1)}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm shadow-ios-sm"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="absolute inset-0 rounded-md overflow-hidden"
        style={{ background: "hsl(var(--muted))" }}
      >
        <TileLayer url={tileUrl} attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />

        <RecenterOnChange center={center} zoom={zoom} />

        {markers?.map((m) => (
          <Marker position={m.position} key={m.id}>
            {m.label ? <Popup>{m.label}</Popup> : null}
          </Marker>
        ))}

        {geojson ? (
          <GeoJSON data={geojson as any} style={{ color: "hsl(var(--primary))", weight: 2 }} />
        ) : null}

        {mapChildren}
      </MapContainer>

      {/* Floating overlays */}
      {children ? (
        <div className="pointer-events-none absolute inset-0">
          <div className="pointer-events-auto p-3 flex gap-2 justify-end">
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}
