import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
  children?: React.ReactNode; // floating overlays
};

const MAPTILER_STYLES: Record<BaseLayerId, string> = {
  streets: "maps/streets-v2",
  satellite: "tiles/satellite",
  terrain: "maps/topo-v2",
};

export default function MapView({
  center = [-23.55, -46.63],
  zoom = 5,
  baseLayerId = "streets",
  markers = [],
  geojson,
  className,
  children,
}: MapViewProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // Fetch MapTiler API key from Edge Function
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("maptiler-token", { method: "GET" });
        if (!active) return;
        if (error) {
          setError("Não foi possível obter a chave do MapTiler.");
        } else {
          setApiKey((data as any)?.key || null);
          if (!(data as any)?.key) {
            setError("Chave MAPTILER_API_KEY ausente nas Secrets do Supabase.");
          }
        }
      } catch (e: any) {
        if (!active) return;
        setError("Erro ao buscar a chave do MapTiler.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const tileUrl = useMemo(() => {
    const style = MAPTILER_STYLES[baseLayerId] || MAPTILER_STYLES.streets;
    return apiKey
      ? `https://api.maptiler.com/${style}/256/{z}/{x}/{y}.png?key=${apiKey}`
      : null;
  }, [apiKey, baseLayerId]);

  if (!tileUrl) {
    return (
      <div className={cn("relative w-full h-full flex items-center justify-center p-6", className)}>
        <div className="text-center space-y-2">
          <p className="text-foreground font-medium">Mapa indisponível</p>
          <p className="text-muted-foreground text-sm">
            Configure a secret <strong>MAPTILER_API_KEY</strong> nas Edge Function Secrets do Supabase.
          </p>
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

        {markers?.map((m) => (
          <Marker position={m.position} key={m.id}>
            {m.label ? <Popup>{m.label}</Popup> : null}
          </Marker>
        ))}

        {geojson ? (
          <GeoJSON data={geojson as any} style={{ color: "hsl(var(--primary))", weight: 2 }} />
        ) : null}
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
