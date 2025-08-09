import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Map } from 'maplibre-gl';
import { Popup } from 'maplibre-gl';
import { Plus, Minus, Navigation, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import CompassDialIcon from '@/components/icons/CompassDialIcon';
import MapCore from '@/components/map/MapCore';

const DEFAULT_CENTER: [number, number] = [-47.8825, -15.7942];
const DEFAULT_ZOOM = 12;

const LoginMapa: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<Map | null>(null);
  const [bearing, setBearing] = useState(0);

  // Layer toggles and NDVI opacity
  const [layerState, setLayerState] = useState({
    talhoes: true,
    ocorrencias: true,
    ndvi: false,
    marketing: true,
  });
  const [ndviOpacity, setNdviOpacity] = useState(0.6);

  // Internal refs to avoid re-adding layers/tooltips
  const layersAddedRef = useRef(false);
  const marketingPopupRef = useRef<Popup | null>(null);

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

  // Update NDVI opacity on change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer('ndvi-raster')) {
      map.setPaintProperty('ndvi-raster', 'raster-opacity', ndviOpacity);
    }
  }, [ndviOpacity]);

  // Helper to toggle layer visibility safely
  const setLayerVisibility = useCallback((ids: string[], visible: boolean) => {
    const map = mapRef.current;
    if (!map) return;
    ids.forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
      }
    });
  }, []);

  // Sync UI toggles to map layers
  useEffect(() => {
    setLayerVisibility(['talhoes-line'], layerState.talhoes);
    setLayerVisibility(['occurrences-clusters', 'occurrences-cluster-count', 'occurrences-unclustered'], layerState.ocorrencias);
    setLayerVisibility(['ndvi-raster'], layerState.ndvi);
    setLayerVisibility(['marketing-points'], layerState.marketing);
  }, [layerState, setLayerVisibility]);

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

      {/* Layer Toggle Panel */}
      <aside className="absolute top-16 right-4 z-20 w-44 rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-ios-md p-3 space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="chk-talhoes" checked={layerState.talhoes} onCheckedChange={(v) => setLayerState((s) => ({ ...s, talhoes: Boolean(v) }))} />
          <Label htmlFor="chk-talhoes" className="text-xs">Talhões</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="chk-ocorrencias" checked={layerState.ocorrencias} onCheckedChange={(v) => setLayerState((s) => ({ ...s, ocorrencias: Boolean(v) }))} />
          <Label htmlFor="chk-ocorrencias" className="text-xs">Ocorrências</Label>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="ndvi-opacity" className="text-xs">NDVI</Label>
            <Checkbox id="chk-ndvi" checked={layerState.ndvi} onCheckedChange={(v) => setLayerState((s) => ({ ...s, ndvi: Boolean(v) }))} />
          </div>
          <Slider id="ndvi-opacity" value={[Math.round(ndviOpacity * 100)]} onValueChange={(val) => setNdviOpacity((val?.[0] ?? 60) / 100)} min={0} max={100} step={5} />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="chk-marketing" checked={layerState.marketing} onCheckedChange={(v) => setLayerState((s) => ({ ...s, marketing: Boolean(v) }))} />
          <Label htmlFor="chk-marketing" className="text-xs">Marketing</Label>
        </div>
      </aside>

      {/* Fullscreen Map */}
      <MapCore
        className="absolute inset-0"
        initialCenter={DEFAULT_CENTER}
        initialZoom={DEFAULT_ZOOM}
        styleId="satellite"
        onMapReady={(map) => {
          mapRef.current = map;

          if (layersAddedRef.current) return;

          const addAllLayers = () => {
            if (layersAddedRef.current) return;
            layersAddedRef.current = true;

            // Basic error logging without blocking UI
            map.on('error', (e) => {
              // @ts-expect-error - maplibre error typing
              const src = e?.sourceId || 'unknown';
              console.warn('Map source error:', src);
            });

            const [lng, lat] = DEFAULT_CENTER;

            // Talhões - simple polygon outline
            const talhoes = {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: { id: 'T1', name: 'Talhão 1' },
                  geometry: {
                    type: 'Polygon',
                    coordinates: [
                      [
                        [lng - 0.02, lat - 0.01],
                        [lng + 0.02, lat - 0.01],
                        [lng + 0.02, lat + 0.01],
                        [lng - 0.02, lat + 0.01],
                        [lng - 0.02, lat - 0.01],
                      ],
                    ],
                  },
                },
              ],
            } as GeoJSON.FeatureCollection;

            if (!map.getSource('talhoes')) {
              map.addSource('talhoes', { type: 'geojson', data: talhoes });
            }
            if (!map.getLayer('talhoes-line')) {
              map.addLayer({
                id: 'talhoes-line',
                type: 'line',
                source: 'talhoes',
                minzoom: 10,
                paint: {
                  'line-color': '#6b7280', // muted gray
                  'line-width': 1.5,
                  'line-opacity': 0.9,
                },
              });
            }

            // Ocorrências - clustered points
            const occurrences = {
              type: 'FeatureCollection',
              features: [
                { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [lng + 0.01, lat + 0.004] } },
                { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [lng - 0.015, lat - 0.006] } },
                { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [lng + 0.012, lat - 0.008] } },
              ],
            } as GeoJSON.FeatureCollection;

            if (!map.getSource('occurrences')) {
              map.addSource('occurrences', {
                type: 'geojson',
                data: occurrences,
                cluster: true,
                clusterRadius: 40,
                clusterMaxZoom: 14,
              });
            }
            if (!map.getLayer('occurrences-clusters')) {
              map.addLayer({
                id: 'occurrences-clusters',
                type: 'circle',
                source: 'occurrences',
                filter: ['has', 'point_count'],
                paint: {
                  'circle-color': '#3b82f6',
                  'circle-radius': 16,
                  'circle-opacity': 0.75,
                },
                minzoom: 3,
              });
            }
            if (!map.getLayer('occurrences-cluster-count')) {
              map.addLayer({
                id: 'occurrences-cluster-count',
                type: 'symbol',
                source: 'occurrences',
                filter: ['has', 'point_count'],
                layout: {
                  'text-field': ['get', 'point_count_abbreviated'],
                  'text-size': 12,
                },
                paint: {
                  'text-color': '#ffffff',
                },
                minzoom: 3,
              });
            }
            if (!map.getLayer('occurrences-unclustered')) {
              map.addLayer({
                id: 'occurrences-unclustered',
                type: 'circle',
                source: 'occurrences',
                filter: ['!', ['has', 'point_count']],
                paint: {
                  'circle-color': '#f59e0b',
                  'circle-radius': 5,
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#1f2937',
                },
                minzoom: 3,
              });
            }

            // NDVI raster overlay (public WMTS)
            if (!map.getSource('ndvi')) {
              map.addSource('ndvi', {
                type: 'raster',
                tiles: [
                  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_NDVI_Anomaly/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png',
                ],
                tileSize: 256,
                attribution: 'NASA GIBS',
              });
            }
            if (!map.getLayer('ndvi-raster')) {
              map.addLayer({
                id: 'ndvi-raster',
                type: 'raster',
                source: 'ndvi',
                paint: { 'raster-opacity': ndviOpacity },
                layout: { visibility: layerState.ndvi ? 'visible' : 'none' },
              });
            }

            // Marketing pins
            const marketing = {
              type: 'FeatureCollection',
              features: [
                { type: 'Feature', properties: { title: 'Ponto A' }, geometry: { type: 'Point', coordinates: [lng + 0.01, lat] } },
                { type: 'Feature', properties: { title: 'Ponto B' }, geometry: { type: 'Point', coordinates: [lng - 0.015, lat + 0.008] } },
              ],
            } as GeoJSON.FeatureCollection;

            if (!map.getSource('marketing')) {
              map.addSource('marketing', { type: 'geojson', data: marketing });
            }
            if (!map.getLayer('marketing-points')) {
              map.addLayer({
                id: 'marketing-points',
                type: 'circle',
                source: 'marketing',
                minzoom: 6,
                paint: {
                  'circle-radius': 5,
                  'circle-color': '#22c55e',
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#111827',
                },
              });
            }

            // Simple tooltip for marketing points
            map.on('mouseenter', 'marketing-points', (e) => {
              map.getCanvas().style.cursor = 'pointer';
              // @ts-expect-error - features may be undefined in type
              const f = e?.features?.[0];
              const title = f?.properties?.title || 'Ponto';
              if (!marketingPopupRef.current) {
                marketingPopupRef.current = new Popup({ closeButton: false, closeOnClick: false });
              }
              // @ts-expect-error - maplibre types for events
              marketingPopupRef.current!.setLngLat(e.lngLat).setText(String(title)).addTo(map);
            });
            map.on('mousemove', 'marketing-points', (e) => {
              if (!marketingPopupRef.current) return;
              // @ts-expect-error - maplibre types for events
              marketingPopupRef.current.setLngLat(e.lngLat);
            });
            map.on('mouseleave', 'marketing-points', () => {
              map.getCanvas().style.cursor = '';
              if (marketingPopupRef.current) {
                marketingPopupRef.current.remove();
                marketingPopupRef.current = null;
              }
            });

            // Apply initial visibilities based on current UI state
            if (!layerState.talhoes && map.getLayer('talhoes-line')) map.setLayoutProperty('talhoes-line', 'visibility', 'none');
            if (!layerState.ocorrencias) {
              ['occurrences-clusters', 'occurrences-cluster-count', 'occurrences-unclustered'].forEach((id) => {
                if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
              });
            }
          };

          if (map.isStyleLoaded()) {
            addAllLayers();
          } else {
            map.on('load', addAllLayers);
          }
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
