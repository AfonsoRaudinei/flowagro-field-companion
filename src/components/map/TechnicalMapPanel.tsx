import React, { useEffect, useMemo, useRef, useState } from "react";
import MapView from "@/components/map/MapView";
import MapDrawingControls from "@/components/map/MapDrawingControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CloudSun, Radar, Megaphone, ScanLine, Layers, Filter, LocateFixed, PenTool, Edit3, Magnet, Save, Shapes, MessageSquare, ChevronDown } from "lucide-react";
import { GPSService } from "@/services/gpsService";

// Minimal geo helpers (planar approximation)
function polygonArea(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[(i + 1) % coords.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

function perimeter(coords: [number, number][]): number {
  if (coords.length < 2) return 0;
  let p = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    p += Math.sqrt(dx * dx + dy * dy);
  }
  return p;
}

function centroid(coords: [number, number][]): [number, number] | null {
  if (coords.length < 3) return null;
  let x = 0,
    y = 0,
    f: number;
  let A = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    f = coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1];
    x += (coords[i][0] + coords[i + 1][0]) * f;
    y += (coords[i][1] + coords[i + 1][1]) * f;
    A += f;
  }
  A *= 0.5;
  if (A === 0) return null;
  x /= 6 * A;
  y /= 6 * A;
  return [y, x];
}

const layerOptions = [
  { id: "ndvi", label: "NDVI" },
  { id: "solo", label: "Solo" },
  { id: "marketing", label: "Marketing" },
  { id: "ocorrencias", label: "Ocorrências" },
  { id: "talhoes", label: "Talhões" },
];


const TechnicalMapPanel: React.FC = () => {
  const [center, setCenter] = useState<[number, number]>([-23.55, -46.63]);
  const [zoom] = useState(5);
  const [baseLayerId, setBaseLayerId] = useState<"streets" | "satellite" | "terrain">("streets");

  // UI states
  const [query, setQuery] = useState("");
  const [layersOpen, setLayersOpen] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({});
  
  const [filterOn, setFilterOn] = useState(false);

  // Drawing
  const [drawingBar, setDrawingBar] = useState(false);
  const [editing, setEditing] = useState(false);
  const [snapOn, setSnapOn] = useState(false);
  const [geometry, setGeometry] = useState<GeoJSON.FeatureCollection | null>(null);

  // Bottom panel
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!layersOpen) return;
      const target = e.target as HTMLElement;
      if (!target.closest("#layers-dropdown") && !target.closest("#layers-btn")) {
        setLayersOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [layersOpen]);

  const handleToggleLayer = (id: string) => {
    setActiveLayers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLocate = async () => {
    try {
      const loc = await GPSService.getCurrentLocation();
      setCenter([loc.latitude, loc.longitude]);
    } catch (e) {
      // silent fallback
    }
  };

  const handleStartDraw = () => {
    setDrawingBar(v => !v);
  };

  const createSamplePolygon = () => {
    const [lat, lng] = center;
    const d = 0.05;
    const coords: [number, number][]= [
      [lat + d, lng - d],
      [lat + d, lng + d],
      [lat - d, lng + d],
      [lat - d, lng - d],
      [lat + d, lng - d],
    ];
    const feature: GeoJSON.Feature = {
      type: "Feature",
      properties: { name: "Talhão A" },
      geometry: {
        type: "Polygon",
        coordinates: [coords.map(([la, lo]) => [lo, la])],
      },
    };
    setGeometry({ type: "FeatureCollection", features: [feature] });
    setPanelOpen(true);
  };

  const metrics = useMemo(() => {
    if (!geometry || geometry.features.length === 0) return null;
    const poly = geometry.features[0].geometry as GeoJSON.Polygon;
    const ll = poly.coordinates[0].map(([lng, lat]) => [lat, lng]) as [number, number][];
    const A = polygonArea(ll);
    const P = perimeter(ll);
    const C = centroid(ll);
    return { areaHa: (A * 12365).toFixed(2), // fake conversion just for UI
             perimM: (P * 111000).toFixed(0),
             centroid: C ? `${C[0].toFixed(5)}, ${C[1].toFixed(5)}` : "-" };
  }, [geometry]);

  return (
    <div className="relative w-full h-screen max-w-md mx-auto bg-background">
      {/* AppBar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-card/95 border-b border-border px-3 pt-3 pb-2">
        <div className="flex items-center justify-center">
          <h1 className="text-base font-semibold">Mapa Técnico</h1>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar fazenda, talhão ou ocorrência"
            className="h-10 flex-1"
          />
          <div className="flex items-center gap-1">
            <Button id="layers-btn" onClick={() => setLayersOpen(v=>!v)} variant="secondary" size="icon" className="h-10 w-10">
              <Layers className="h-5 w-5" />
            </Button>
            <Button onClick={handleLocate} variant="secondary" size="icon" className="h-10 w-10">
              <LocateFixed className="h-5 w-5" />
            </Button>
            <Button onClick={() => setFilterOn(v => !v)} variant={filterOn ? "default" : "secondary"} size="icon" className="h-10 w-10">
              <Filter className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {/* Inline Dropdown */}
        <div id="layers-dropdown" className={`relative z-[1100] mt-2 ${layersOpen ? '' : 'hidden'}`}>
          <div className="rounded-md border border-border bg-popover p-3 shadow-md">
            <div className="text-xs font-medium text-muted-foreground mb-2">Camadas</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {layerOptions.map(o => (
                <label key={o.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!activeLayers[o.id]} onChange={() => handleToggleLayer(o.id)} />
                  {o.label}
                </label>
              ))}
            </div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Tipo de mapa</div>
            <div className="flex items-center gap-3">
              {[
                { id: "streets", label: "Ruas" },
                { id: "satellite", label: "Satélite" },
                { id: "terrain", label: "Terreno" },
              ].map(opt => (
                <label key={opt.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="base"
                    checked={baseLayerId === (opt.id as "streets" | "satellite" | "terrain")}
                    onChange={() => setBaseLayerId(opt.id as "streets" | "satellite" | "terrain")}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="absolute inset-0 pt-[88px] pb-[64px]">
        <MapView
          center={center}
          zoom={zoom}
          baseLayerId={baseLayerId}
          geojson={geometry ?? undefined}
          mapChildren={
            <MapDrawingControls
              enabled={drawingBar}
              editing={editing}
              snapping={snapOn}
              onChange={(fc) => {
                setGeometry(fc);
                if (fc) setPanelOpen(true);
              }}
            />
          }
        />
      </div>

      {/* Floating Quick Actions (left) */}
      <div className="absolute left-2 top-[100px] z-[1000] flex flex-col gap-2">
        {[{icon: CloudSun, id:'clima', label:'Clima'}, {icon: Radar, id:'radar', label:'Radar'}, {icon: Megaphone, id:'marketing', label:'Marketing'}, {icon: MessageSquare, id:'interacoes', label:'Interações'}, {icon: Shapes, id:'ocorrencias', label:'Ocorrências'}, {icon: ScanLine, id:'scanner', label:'Scanner'}].map(({icon:Icon,id,label}) => (
          <Button key={id} variant={activeLayers[id] ? 'default' : 'secondary'} size="icon" className="h-10 w-10" onClick={() => handleToggleLayer(id)} aria-label={label} title={label}>
            <Icon className="h-5 w-5" />
          </Button>
        ))}
      </div>

      {/* Floating Tools Dock (right) */}
      <div className="absolute right-2 top-[100px] z-[1000] flex flex-col gap-2">
        <Button onClick={() => { setLayersOpen(v=>!v); }} variant="secondary" size="icon" className="h-10 w-10" aria-label="Dropdown Camadas">
          <Layers className="h-5 w-5" />
        </Button>
        <Button onClick={handleStartDraw} variant={drawingBar ? 'default' : 'secondary'} size="icon" className="h-10 w-10" aria-label="Botão Desenhar">
          <PenTool className="h-5 w-5" />
        </Button>
        <Button onClick={() => setEditing(v=>!v)} variant={editing ? 'default' : 'secondary'} size="icon" className="h-10 w-10" aria-label="Botão Editar">
          <Edit3 className="h-5 w-5" />
        </Button>
        <Button onClick={() => setSnapOn(v=>!v)} variant={snapOn ? 'default' : 'secondary'} size="icon" className="h-10 w-10" aria-label="Botão Snap/Imã">
          <Magnet className="h-5 w-5" />
        </Button>
        <Button onClick={() => setPanelOpen(true)} disabled={!geometry} variant="default" size="icon" className="h-10 w-10" aria-label="Botão Salvar">
          <Save className="h-5 w-5" />
        </Button>
      </div>

      {/* Drawing sub-toolbar */}
      {drawingBar && (
        <div className="absolute left-0 right-0 top-[88px] z-[1000] flex items-center gap-2 px-3 py-2 bg-card/95 border-b border-border">
          <Button size="sm" variant="secondary" onClick={createSamplePolygon}>Mão Livre</Button>
          <Button size="sm" variant="secondary" onClick={createSamplePolygon}>Polígono</Button>
          <Button size="sm" variant="secondary" onClick={createSamplePolygon}>Pivô</Button>
          <Button size="sm" variant="secondary" onClick={createSamplePolygon}>Retângulo</Button>
          <Button size="sm" variant="destructive" onClick={() => { setGeometry(null); setPanelOpen(false); }}>Remover</Button>
        </div>
      )}

      {/* Bottom Sliding Panel */}
      <div ref={panelRef} className={`absolute left-0 right-0 bottom-0 z-[1000] border-t border-border bg-card/95 ${panelOpen ? 'h-[40%]' : 'h-12'} transition-[height]`}>
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Painel Detalhes da Área</h3>
            {geometry && <Badge variant="secondary">Selecionado</Badge>}
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setPanelOpen(v=>!v)}>
            <ChevronDown className={`h-5 w-5 ${panelOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        {panelOpen && (
          <div className="px-4 pb-4 space-y-3 overflow-y-auto h-[calc(100%-48px)]">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Nome do Talhão</div>
                <Input defaultValue={geometry ? 'Talhão A' : ''} placeholder="Defina um nome" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Área (ha)</div>
                <div className="font-medium">{metrics?.areaHa ?? '-'} ha</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Perímetro (m)</div>
                <div className="font-medium">{metrics?.perimM ?? '-'} m</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Centroide (lat/long)</div>
                <div className="font-medium">{metrics?.centroid ?? '-'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground">Status de sobreposição</div>
                <div className="font-medium">{geometry ? 'Sem sobreposição' : '-'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="default" disabled={!geometry}>Salvar</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicalMapPanel;
