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

// Resolve a base map style with MapTiler when key is present, otherwise use public demotiles
function resolveBaseStyle(styleId: string | undefined) {
  const key = typeof window !== "undefined" ? localStorage.getItem("MAPTILER_API_KEY") : null;
  const id = styleId || "satellite";
  if (key) {
    const maptiler = {
      satellite: `https://api.maptiler.com/maps/satellite/style.json?key=${key}`,
      hybrid: `https://api.maptiler.com/maps/hybrid/style.json?key=${key}`,
      terrain: `https://api.maptiler.com/maps/landscape/style.json?key=${key}`,
      streets: `https://api.maptiler.com/maps/streets/style.json?key=${key}`,
    } as Record<string, string>;
    return maptiler[id] || maptiler.satellite;
  }
  // Tokenless public fallback style (prevents white screen)
  return "https://demotiles.maplibre.org/style.json" as any;
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

// Initialize map once with container readiness and one-time fallback
useEffect(() => {
  const node = containerRef?.current || localRef.current;
  if (!node || mapRef.current) return;

  let destroyed = false;
  let sizeObserver: ResizeObserver | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let readyToInit = false;

  const tryInit = async () => {
    if (destroyed || mapRef.current || !readyToInit) return;
    const m = await import("maplibre-gl");
    await import("maplibre-gl/dist/maplibre-gl.css");
    maplibreRef.current = m;

    const initialStyle = resolveBaseStyle(styleId);
    const map = new m.Map({
      container: node,
      style: initialStyle,
      center: initialCenter,
      zoom: initialZoom,
      bearing: initialBearing,
      pitch: 0,
    });
    mapRef.current = map as Map;

    // One-time boot fallback to demotiles if style errors before first load
    let hasFallbackApplied = false;
    const demotiles = "https://demotiles.maplibre.org/style.json";
    const handleBootError = (e: any) => {
      if (hasFallbackApplied) return;
      const usingMapTiler = typeof initialStyle === "string" && (initialStyle as string).includes("api.maptiler.com");
      if (usingMapTiler) {
        try {
          (map as any).setStyle(demotiles);
          hasFallbackApplied = true;
        } catch {}
      }
      console.warn("Map style error during boot, applying fallback", e?.error || e);
    };
    map.on("error", handleBootError);

    map.once("load", () => {
      try { map.resize(); } catch {}
      // After first load, stop boot fallback; keep only discreet logging
      map.off("error", handleBootError);
      map.on("error", (e: any) => console.warn("Map error", e?.error || e));

      const handleMove = () => onBearingChange?.(map.getBearing());
      map.on("move", handleMove);
      map.on("rotate", handleMove);

      onMapReady?.(map as Map, m);
    });

    // Observe container size changes for responsive resize
    resizeObserver = new ResizeObserver(() => {
      try { (mapRef.current as any)?.resize(); } catch {}
    });
    resizeObserver.observe(node);
  };

  // Wait until the container has dimensions before initializing
  sizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        readyToInit = true;
        sizeObserver?.disconnect();
        tryInit();
        break;
      }
    }
  });
  sizeObserver.observe(node);

  return () => {
    destroyed = true;
    resizeObserver?.disconnect();
    sizeObserver?.disconnect();
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
