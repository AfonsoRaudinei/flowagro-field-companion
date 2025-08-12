import React, { useEffect } from "react";
import MapView from "@/components/map/MapView";
import { Button } from "@/components/ui/button";
import { CloudSun, Radar, Megaphone, ScanLine, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TechnicalMap: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Mapa técnico | FlowAgro";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute("content", "Mapa técnico com Leaflet/MapTiler: pins, shapes e camadas para uso agrícola.");
    } else {
      const m = document.createElement("meta");
      m.setAttribute("name", "description");
      m.setAttribute("content", "Mapa técnico com Leaflet/MapTiler: pins, shapes e camadas para uso agrícola.");
      document.head.appendChild(m);
    }
    // Canonical
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    const canonicalHref = window.location.href;
    if (existingCanonical) existingCanonical.setAttribute("href", canonicalHref);
    else {
      const l = document.createElement("link");
      l.setAttribute("rel", "canonical");
      l.setAttribute("href", canonicalHref);
      document.head.appendChild(l);
    }
  }, []);

  return (
    <div className="w-full h-screen max-w-md mx-auto bg-background">
      <header className="h-14 px-4 flex items-center justify-between border-b border-border">
        <button
          aria-label="Voltar"
          className="inline-flex items-center gap-2 text-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Voltar</span>
        </button>
        <h1 className="text-base font-semibold">Mapa técnico</h1>
        <div className="w-10" />
      </header>

      <main className="h-[calc(100vh-56px)]">
        <MapView
          center={[-23.55, -46.63]}
          zoom={5}
          baseLayerId="streets"
        >
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="shadow-ios-sm">
              <CloudSun className="h-4 w-4 mr-1" /> Clima
            </Button>
            <Button size="sm" variant="secondary" className="shadow-ios-sm">
              <Radar className="h-4 w-4 mr-1" /> Radar
            </Button>
            <Button size="sm" variant="secondary" className="shadow-ios-sm">
              <Megaphone className="h-4 w-4 mr-1" /> Marketing
            </Button>
            <Button size="sm" variant="secondary" className="shadow-ios-sm">
              <ScanLine className="h-4 w-4 mr-1" /> Scanner
            </Button>
          </div>
        </MapView>
      </main>
    </div>
  );
};

export default TechnicalMap;
