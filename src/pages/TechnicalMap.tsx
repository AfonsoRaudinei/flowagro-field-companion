import React from "react";
import { NavigationHeader } from "@/components/ui/navigation";
import { useNavigate } from "react-router-dom";
import { MapProvider } from "@/components/maps/MapProvider";
import { BaseMap } from "@/components/maps/BaseMap";
import { MapControls } from "@/components/maps/MapControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Map, 
  Layers, 
  Navigation, 
  Ruler,
  CloudRain,
  Route
} from "lucide-react";

const TechnicalMap = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <MapProvider>
      <div className="min-h-screen bg-background">
        <NavigationHeader 
          title="Mapa Técnico" 
          onBack={handleBack}
          showBackButton
        />
        
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Map Area */}
          <div className="flex-1 relative">
            <BaseMap 
              className="w-full h-full"
              showNavigation={true}
              showFullscreen={true}
              showGeolocate={true}
            />
            <MapControls 
              className="top-4 left-4"
              showStyleSelector={true}
              showResetView={true}
              showFullscreenToggle={true}
              vertical={true}
            />
          </div>

          {/* Sidebar */}
          <div className="w-80 bg-card border-l p-4 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Map className="w-5 h-5" />
                  <span>Ferramentas do Mapa</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Camadas Disponíveis</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Badge variant="secondary" className="justify-start">
                      <Layers className="w-3 h-3 mr-1" />
                      Satélite
                    </Badge>
                    <Badge variant="secondary" className="justify-start">
                      <Navigation className="w-3 h-3 mr-1" />
                      Terreno
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Funcionalidades Futuras</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Ruler className="w-4 h-4" />
                      <span>Medição de Áreas</span>
                      <Badge variant="outline" className="ml-auto">Em Breve</Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Route className="w-4 h-4" />
                      <span>Trilhas GPS</span>
                      <Badge variant="outline" className="ml-auto">Em Breve</Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <CloudRain className="w-4 h-4" />
                      <span>Dados Climáticos</span>
                      <Badge variant="outline" className="ml-auto">Em Breve</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    ✨ Sistema de mapas profissional implementado com sucesso!
                    As funcionalidades avançadas serão adicionadas gradualmente.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MapProvider>
  );
};

export default TechnicalMap;