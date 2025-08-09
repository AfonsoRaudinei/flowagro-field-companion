import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Map, GeoJSONSource, MapLayerMouseEvent } from 'maplibre-gl';
import { Popup } from 'maplibre-gl';
import { ArrowLeft, Plus, Minus, Navigation, Pencil, Shapes, Circle as CircleIcon, Square as SquareIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import CompassDialIcon from '@/components/icons/CompassDialIcon';
import MapCore from '@/components/map/MapCore';

// Simple geometry helpers
type LngLat = [number, number];

function pointInPolygon(point: LngLat, vs: LngLat[]): boolean {
  let x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function polygonsOverlap(a: LngLat[], b: LngLat[]): boolean {
  // Basic overlap: any vertex of A in B or vice-versa
  if (a.some((p) => pointInPolygon(p, b))) return true;
  if (b.some((p) => pointInPolygon(p, a))) return true;
  return false;
}

function circleToPolygon(center: LngLat, radiusDeg: number, steps = 64): LngLat[] {
  const coords: LngLat[] = [];
  for (let i = 0; i < steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    coords.push([center[0] + Math.cos(theta) * radiusDeg, center[1] + Math.sin(theta) * radiusDeg]);
  }
  coords.push(coords[0]);
  return coords;
}

const DEFAULT_CENTER: LngLat = [-47.8825, -15.7942];
const DEFAULT_ZOOM = 12;

// Feature model (local only)
interface FeatureShape {
  id: string;
  type: 'Polygon';
  coordinates: LngLat[]; // closed ring
}

const TechnicalMap: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<Map | null>(null);
  const [bearing, setBearing] = useState(0);

  // Layers toggle + NDVI opacity
  const [layerState, setLayerState] = useState({ talhoes: true, ocorrencias: true, ndvi: false, marketing: true });
  const [ndviOpacity, setNdviOpacity] = useState(0.6);

  // Drawing state
  type Tool = 'none' | 'freehand' | 'polygon' | 'pivot' | 'rectangle' | 'remove';
  const [activeTool, setActiveTool] = useState<Tool>('none');
  const [drawMenuOpen, setDrawMenuOpen] = useState(false);
  const [draft, setDraft] = useState<LngLat[]>([]);
  const [shapes, setShapes] = useState<FeatureShape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragVertex, setDragVertex] = useState<{ id: string; index: number } | null>(null);
  const [hasOverlap, setHasOverlap] = useState(false);

  // SEO minimal
  useEffect(() => {
    document.title = 'Mapa Técnico | FlowAgro';
    const desc = 'Desenho e edição de áreas, NDVI e camadas.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = desc;
  }, []);

  // Update map sources when shapes/draft change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const drawings = map.getSource('drawings') as GeoJSONSource | undefined;
    if (drawings) {
      drawings.setData({
        type: 'FeatureCollection',
        features: shapes.map((s) => ({ type: 'Feature', properties: { id: s.id }, geometry: { type: 'Polygon', coordinates: [s.coordinates] } })) as any,
      } as any);
    }
    const preview = map.getSource('drawing-preview') as GeoJSONSource | undefined;
    if (preview) {
      const coords = draft.length > 2 ? [...draft, draft[0]] : draft;
      preview.setData({
        type: 'FeatureCollection',
        features: coords.length ? [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } }] : [],
      } as any);
    }
    const vertices = map.getSource('vertex-handles') as GeoJSONSource | undefined;
    if (vertices) {
      const sel = shapes.find((s) => s.id === selectedId);
      const verts = sel ? sel.coordinates.slice(0, -1) : [];
      vertices.setData({ type: 'FeatureCollection', features: verts.map((c, i) => ({ type: 'Feature', properties: { i }, geometry: { type: 'Point', coordinates: c } })) } as any);
    }
  }, [shapes, draft, selectedId]);

  // Map setup and layers
  const onMapReady = useCallback((map: Map) => {
    mapRef.current = map;

    // Error logging only
    map.on('error', (e) => console.warn('Map error', e));

    // Base placeholder layers (same as /login-mapa)
    const [lng, lat] = DEFAULT_CENTER;
    if (!map.getSource('talhoes')) {
      map.addSource('talhoes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[lng - 0.02, lat - 0.01], [lng + 0.02, lat - 0.01], [lng + 0.02, lat + 0.01], [lng - 0.02, lat + 0.01], [lng - 0.02, lat - 0.01]]] } }] },
      });
    }
    if (!map.getLayer('talhoes-line')) {
      map.addLayer({ id: 'talhoes-line', type: 'line', source: 'talhoes', paint: { 'line-color': '#6b7280', 'line-width': 1.5, 'line-opacity': 0.9 }, minzoom: 10 });
    }

    if (!map.getSource('occurrences')) {
      map.addSource('occurrences', { type: 'geojson', data: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [lng + 0.01, lat + 0.004] } }] }, cluster: true, clusterRadius: 40, clusterMaxZoom: 14 });
    }
    if (!map.getLayer('occurrences-clusters')) {
      map.addLayer({ id: 'occurrences-clusters', type: 'circle', source: 'occurrences', filter: ['has', 'point_count'], paint: { 'circle-color': '#3b82f6', 'circle-radius': 16, 'circle-opacity': 0.75 } });
      map.addLayer({ id: 'occurrences-cluster-count', type: 'symbol', source: 'occurrences', filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12 }, paint: { 'text-color': '#ffffff' } });
      map.addLayer({ id: 'occurrences-unclustered', type: 'circle', source: 'occurrences', filter: ['!', ['has', 'point_count']], paint: { 'circle-color': '#f59e0b', 'circle-radius': 5, 'circle-stroke-width': 1, 'circle-stroke-color': '#1f2937' } });
    }

    if (!map.getSource('ndvi')) {
      map.addSource('ndvi', { type: 'raster', tiles: ['https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_NDVI_Anomaly/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png'], tileSize: 256, attribution: 'NASA GIBS' });
    }
    if (!map.getLayer('ndvi-raster')) {
      map.addLayer({ id: 'ndvi-raster', type: 'raster', source: 'ndvi', paint: { 'raster-opacity': ndviOpacity }, layout: { visibility: layerState.ndvi ? 'visible' : 'none' } });
    }

    if (!map.getSource('marketing')) {
      map.addSource('marketing', { type: 'geojson', data: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { title: 'Visita' }, geometry: { type: 'Point', coordinates: [lng + 0.01, lat] } }] } });
    }
    if (!map.getLayer('marketing-points')) {
      map.addLayer({ id: 'marketing-points', type: 'circle', source: 'marketing', paint: { 'circle-radius': 5, 'circle-color': '#22c55e', 'circle-stroke-width': 1, 'circle-stroke-color': '#111827' } });
      const popup = new Popup({ closeButton: false, closeOnClick: false });
      map.on('mouseenter', 'marketing-points', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const f = (e as any)?.features?.[0];
        const title = f?.properties?.title || 'Ponto';
        popup.setLngLat((e as any).lngLat).setText(String(title)).addTo(map);
      });
      map.on('mouseleave', 'marketing-points', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });
    }

    // Drawing sources/layers
    if (!map.getSource('drawings')) {
      map.addSource('drawings', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } as any });
    }
    if (!map.getLayer('drawings-fill')) {
      map.addLayer({ id: 'drawings-fill', type: 'fill', source: 'drawings', paint: { 'fill-color': hasOverlap ? '#ef4444' : '#22c55e', 'fill-opacity': 0.25 } });
      map.addLayer({ id: 'drawings-line', type: 'line', source: 'drawings', paint: { 'line-color': '#10b981', 'line-width': 2 } });
    }
    if (!map.getSource('drawing-preview')) {
      map.addSource('drawing-preview', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } as any });
    }
    if (!map.getLayer('drawing-preview-fill')) {
      map.addLayer({ id: 'drawing-preview-fill', type: 'fill', source: 'drawing-preview', paint: { 'fill-color': hasOverlap ? '#ef4444' : '#3b82f6', 'fill-opacity': hasOverlap ? 0.3 : 0.15 } });
      map.addLayer({ id: 'drawing-preview-line', type: 'line', source: 'drawing-preview', paint: { 'line-color': hasOverlap ? '#ef4444' : '#2563eb', 'line-width': 2, 'line-dasharray': [2, 2] } });
    }
    if (!map.getSource('vertex-handles')) {
      map.addSource('vertex-handles', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } as any });
    }
    if (!map.getLayer('vertex-layer')) {
      map.addLayer({ id: 'vertex-layer', type: 'circle', source: 'vertex-handles', paint: { 'circle-radius': 4, 'circle-color': '#ffffff', 'circle-stroke-color': '#111827', 'circle-stroke-width': 1.5 } });
    }

    // Select existing shape to edit
    map.on('click', 'drawings-fill', (e: MapLayerMouseEvent) => {
      const f = (e.features as any)?.[0];
      const id = f?.properties?.id as string | undefined;
      setSelectedId(id || null);
      setActiveTool('none');
      setDraft([]);
    });

    // Drag vertices
    map.on('mousedown', 'vertex-layer', (e: MapLayerMouseEvent) => {
      const f = (e.features as any)?.[0];
      const i = f?.properties?.i as number | undefined;
      if (selectedId && typeof i === 'number') {
        setDragVertex({ id: selectedId, index: i });
        (map as any).getCanvas().style.cursor = 'grabbing';
      }
    });

    map.on('mousemove', (e) => {
      if (!dragVertex) return;
      setShapes((prev) => prev.map((s) => {
        if (s.id !== dragVertex.id) return s;
        const coords = s.coordinates.slice();
        coords[dragVertex.index] = [e.lngLat.lng, e.lngLat.lat];
        coords[coords.length - 1] = coords[0];
        return { ...s, coordinates: coords };
      }));
    });
    map.on('mouseup', () => {
      if (dragVertex) {
        (map as any).getCanvas().style.cursor = '';
        setDragVertex(null);
      }
    });
  }, [hasOverlap, layerState.ndvi, ndviOpacity, selectedId, dragVertex]);

  // Layer visibility sync
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    const setVis = (ids: string[], v: boolean) => ids.forEach((id) => map.getLayer(id) && map.setLayoutProperty(id, 'visibility', v ? 'visible' : 'none'));
    setVis(['talhoes-line'], layerState.talhoes);
    setVis(['occurrences-clusters','occurrences-cluster-count','occurrences-unclustered'], layerState.ocorrencias);
    setVis(['ndvi-raster'], layerState.ndvi);
    setVis(['marketing-points'], layerState.marketing);
  }, [layerState]);

  // NDVI opacity sync
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (map.getLayer('ndvi-raster')) map.setPaintProperty('ndvi-raster', 'raster-opacity', ndviOpacity);
  }, [ndviOpacity]);

  // Drawing interactions per tool
  useEffect(() => {
    const map = mapRef.current; if (!map) return;

    const onClickPoly = (e: MapLayerMouseEvent) => {
      if (activeTool !== 'polygon') return;
      const next = [...draft, [e.lngLat.lng, e.lngLat.lat] as LngLat];
      setDraft(next);
      if (next.length >= 3) {
        // Check overlap live
        const closed = [...next, next[0]];
        const overlap = shapes.some((s) => polygonsOverlap(s.coordinates, closed));
        setHasOverlap(overlap);
      }
    };
    const onDblClick = () => {
      if (activeTool !== 'polygon') return;
      if (draft.length >= 3) {
        const closed = [...draft, draft[0]];
        setShapes((prev) => [...prev, { id: String(Date.now()), type: 'Polygon', coordinates: closed }]);
      }
      setDraft([]); setActiveTool('none'); setHasOverlap(false);
    };

    const onMouseDown = (e: any) => {
      if (activeTool === 'rectangle' || activeTool === 'pivot' || activeTool === 'freehand') {
        const start: LngLat = [e.lngLat.lng, e.lngLat.lat];
        setDraft([start]);
        const onMove = (ev: any) => {
          const cur: LngLat = [ev.lngLat.lng, ev.lngLat.lat];
          if (activeTool === 'rectangle') {
            const [x1, y1] = start; const [x2, y2] = cur;
            const poly: LngLat[] = [[x1, y1],[x2, y1],[x2, y2],[x1, y2],[x1, y1]];
            setDraft(poly.slice(0, -1));
            setHasOverlap(shapes.some((s) => polygonsOverlap(s.coordinates, poly)));
          } else if (activeTool === 'pivot') {
            const dx = cur[0] - start[0]; const dy = cur[1] - start[1];
            const radius = Math.sqrt(dx*dx + dy*dy);
            const poly = circleToPolygon(start, radius);
            setDraft(poly.slice(0, -1));
            setHasOverlap(shapes.some((s) => polygonsOverlap(s.coordinates, poly)));
          } else if (activeTool === 'freehand') {
            setDraft((prev) => [...prev, cur]);
          }
        };
        const onUp = () => {
          map.off('mousemove', onMove); map.off('mouseup', onUp);
          if (activeTool === 'freehand' && draft.length > 2) {
            const closed = [...draft, draft[0]];
            setShapes((prev) => [...prev, { id: String(Date.now()), type: 'Polygon', coordinates: closed }]);
          } else if ((activeTool === 'rectangle' || activeTool === 'pivot') && draft.length) {
            const coords = [...draft, draft[0]];
            setShapes((prev) => [...prev, { id: String(Date.now()), type: 'Polygon', coordinates: coords }]);
          }
          setDraft([]); setActiveTool('none'); setHasOverlap(false);
        };
        map.on('mousemove', onMove); map.on('mouseup', onUp);
      }
    };

    map.on('click', onClickPoly);
    map.on('dblclick', onDblClick);
    map.on('mousedown', onMouseDown);

    return () => {
      map.off('click', onClickPoly);
      map.off('dblclick', onDblClick);
      map.off('mousedown', onMouseDown);
    };
  }, [activeTool, draft, shapes]);

  // Controls
  const zoomIn = useCallback(() => mapRef.current?.zoomIn(), []);
  const zoomOut = useCallback(() => mapRef.current?.zoomOut(), []);
  const recenter = useCallback(() => mapRef.current?.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, essential: true }), []);
  const resetBearing = useCallback(() => mapRef.current?.easeTo({ bearing: 0, duration: 500 }), []);

  // Selected removal
  const removeSelected = useCallback(() => {
    if (!selectedId) return;
    setShapes((prev) => prev.filter((s) => s.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  return (
    <div className="relative w-full h-screen bg-background">
      {/* Top bar */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full border border-border bg-card/70 backdrop-blur-sm shadow-ios-md" aria-label="Voltar" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Button>
        <h1 className="text-base font-semibold text-foreground">Mapa Técnico</h1>
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

      {/* Map */}
      <MapCore className="absolute inset-0" initialCenter={DEFAULT_CENTER} initialZoom={DEFAULT_ZOOM} styleId="satellite" onMapReady={onMapReady} onBearingChange={setBearing} />

      {/* Drawing vertical toolbar */}
      <aside className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col space-y-3">
        <div className="relative">
          <Button onClick={() => setDrawMenuOpen((s) => !s)} variant="ghost" className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border" aria-label="Desenhar">
            <Pencil className="h-5 w-5 text-foreground" />
          </Button>
          {drawMenuOpen && (
            <div className="absolute -top-2 right-14 flex items-center gap-2 rounded-xl border border-border bg-card/90 backdrop-blur-sm shadow-ios-md px-2 py-2">
              <Button size="sm" variant={activeTool==='freehand'?'default':'outline'} onClick={() => setActiveTool('freehand')}>Mão Livre</Button>
              <Button size="sm" variant={activeTool==='polygon'?'default':'outline'} onClick={() => setActiveTool('polygon')}>Polígono</Button>
              <Button size="sm" variant={activeTool==='pivot'?'default':'outline'} onClick={() => setActiveTool('pivot')}>Pivô</Button>
              <Button size="sm" variant={activeTool==='rectangle'?'default':'outline'} onClick={() => setActiveTool('rectangle')}>Retângulo</Button>
              <Button size="sm" variant="destructive" onClick={removeSelected} disabled={!selectedId}><Trash2 className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
        <Button onClick={zoomIn} variant="ghost" className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border"><Plus className="h-5 w-5 text-foreground" /></Button>
        <Button onClick={zoomOut} variant="ghost" className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border"><Minus className="h-5 w-5 text-foreground" /></Button>
        <Button onClick={recenter} variant="ghost" className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border"><Navigation className="h-5 w-5 text-foreground" /></Button>
        <Button onClick={resetBearing} variant="ghost" className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border" aria-label="Resetar orientação">
          <CompassDialIcon bearing={bearing} className="h-5 w-5 text-foreground" />
        </Button>
      </aside>
    </div>
  );
};

export default TechnicalMap;
