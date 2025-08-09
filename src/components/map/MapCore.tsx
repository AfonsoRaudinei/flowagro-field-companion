import React, { useEffect, useRef } from "react";
import type { Map } from "maplibre-gl";

interface MapCoreProps extends React.HTMLAttributes<HTMLDivElement> {
  containerRef?: React.RefObject<HTMLDivElement>;
  initialCenter?: [number, number];
  initialZoom?: number;
  initialBearing?: number;
  styleId?: "satellite" | "hybrid" | "terrain" | "osm" | string;
  onMapReady?: (map: Map, maplibre: typeof import("maplibre-gl")) => void;
  onBearingChange?: (bearing: number) => void;
}

// Resolve a base map style with MapTiler when key is present, otherwise OSM fallback
function resolveBaseStyle(styleId: string | undefined) {
  const key = typeof window !== "undefined" ? localStorage.getItem("MAPTILER_API_KEY") : null;
  const id = styleId || "satellite";
  if (key) {
    const maptiler = {
      satellite: `https://api.maptiler.com/maps/satellite/style.json?key=${key}`,
      hybrid: `https://api.maptiler.com/maps/hybrid/style.json?key=${key}`,
      terrain: `https://api.maptiler.com/maps/landscape/style.json?key=${key}`,
    } as Record<string, string>;
    return maptiler[id] || maptiler.satellite;
  }
  // Tokenless OSM raster fallback
  return {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm",
      },
    ],
  } as any;
}

const MapCore: React.FC<MapCoreProps> = ({
  containerRef,
  className = "",
  initialCenter = [-52.0, -10.0],
  initialZoom = 14,
  initialBearing = 0,
  styleId = "satellite",
  onMapReady,
  onBearingChange,
  ...rest
}) => {
  const localRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const maplibreRef = useRef<null | (typeof import("maplibre-gl"))>(null);

  // Initialize map once
  useEffect(() => {
    const node = containerRef?.current || localRef.current;
    if (!node || mapRef.current) return;

    (async () => {
      const m = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");
      maplibreRef.current = m;

      const map = new m.Map({
        container: node,
        style: resolveBaseStyle(styleId),
        center: initialCenter,
        zoom: initialZoom,
        bearing: initialBearing,
        pitch: 0,
      });
      mapRef.current = map as Map;

      const handleMove = () => onBearingChange?.(map.getBearing());
      map.on("move", handleMove);
      map.on("rotate", handleMove);

      onMapReady?.(map as Map, m);
    })();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update style when styleId changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const style = resolveBaseStyle(styleId);
      (map as any).setStyle(style as any);
    } catch (e) {
      // ignore
    }
  }, [styleId]);

  return <div ref={containerRef || localRef} className={className} {...rest} />;
};

export default MapCore;
