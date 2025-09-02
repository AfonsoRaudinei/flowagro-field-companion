import React from "react";
import { useNavigate } from "react-router-dom";
import { MapProvider } from "@/components/maps/MapProvider";
import { FullscreenTransitions } from '@/components/maps/FullscreenTransitions';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent as UISidebarContent, 
  SidebarTrigger,
  useSidebar 
} from "@/components/ui/sidebar";
import { 
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PremiumButton } from "@/components/ui/premium-button";
import { IntegratedMapInterface } from "@/components/maps/IntegratedMapInterface";
import { FloatingLayerSelector } from "@/components/maps/FloatingLayerSelector";
import { 
  Menu,
  Map, 
  Layers, 
  Navigation, 
  Ruler,
  CloudRain,
  Route,
  MapPin,
  Leaf
} from "lucide-react";
import { PinControls } from "@/components/maps/PinControls";
import { NDVIControls } from "@/components/maps/NDVIControls";
import { NDVIAnalysis } from "@/components/maps/NDVIAnalysis";
import NDVIHistory from "@/components/maps/NDVIHistory";

// Sidebar Content Component
const MapSidebarContent = () => (
  <div className="p-4 space-y-4">
    <PinControls />
    <NDVIControls />
    <NDVIAnalysis />
    <NDVIHistory />
    
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Map className="w-5 h-5" />
          <span>Camadas Base</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Controles Premium</h4>
          <div className="grid grid-cols-1 gap-2">
            <PremiumButton 
              variant="premium" 
              size="sm"
              animation="full"
              className="justify-start"
            >
              <Layers className="w-3 h-3 mr-2" />
              Análise Avançada
            </PremiumButton>
            
            <PremiumButton 
              variant="outline" 
              size="sm"
              animation="hover"
              className="justify-start"
            >
              <Navigation className="w-3 h-3 mr-2" />
              Navegação Inteligente
            </PremiumButton>
            
            <PremiumButton 
              variant="glow" 
              size="sm"
              animation="pulse"
              className="justify-start"
            >
              <Leaf className="w-3 h-3 mr-2" />
              Monitor NDVI Live
            </PremiumButton>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Ações Rápidas</h4>
          <div className="flex gap-2">
            <PremiumButton 
              variant="secondary" 
              size="icon"
              animation="bounce"
              className="premium-icon"
            >
              <MapPin className="h-4 w-4" />
            </PremiumButton>
            
            <PremiumButton 
              variant="ghost" 
              size="icon"
              animation="hover"
              className="premium-icon"
            >
              <Ruler className="h-4 w-4" />
            </PremiumButton>
            
            <PremiumButton 
              variant="outline" 
              size="icon"
              animation="press"
              className="premium-icon availability-pulse"
            >
              <Route className="h-4 w-4" />
            </PremiumButton>
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
              <Route className="w-4 w-4" />
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
      </CardContent>
    </Card>
  </div>
);

// Mobile Header Component
const MobileHeader = () => {
  const navigate = useNavigate();
  
  return (
    <header className="flex items-center justify-between p-4 bg-background/95 backdrop-blur-sm border-b border-border/50 z-50">
      <div className="flex items-center space-x-3">
        <PremiumButton
          variant="ghost"
          size="icon"
          animation="hover"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
        >
          <Menu className="h-5 w-5" />
        </PremiumButton>
        <h1 className="text-lg font-semibold">Mapa Técnico</h1>
      </div>
      
      <Drawer>
        <DrawerTrigger asChild>
          <PremiumButton
            variant="outline"
            size="icon"
            animation="press"
            aria-label="Abrir controles"
          >
            <Layers className="h-5 w-5" />
          </PremiumButton>
        </DrawerTrigger>
        <DrawerContent className="h-[70vh]">
          <DrawerHeader>
            <DrawerTitle>Controles do Mapa</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">
            <MapSidebarContent />
          </div>
        </DrawerContent>
      </Drawer>
    </header>
  );
};

// Desktop Layout Component  
const DesktopLayout = () => {
  const navigate = useNavigate();
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Header with Sidebar Trigger */}
        <header className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 bg-background/95 backdrop-blur-sm border-b border-border/50 z-50">
          <div className="flex items-center space-x-3">
            <SidebarTrigger className="lg:hidden" />
            <PremiumButton
              variant="ghost"
              size="icon"
              animation="hover"
              onClick={() => navigate(-1)}
              aria-label="Voltar"
              className="lg:flex hidden"
            >
              <Menu className="h-5 w-5" />
            </PremiumButton>
            <h1 className="text-lg font-semibold">Mapa Técnico</h1>
          </div>
          
          <div className="hidden lg:block">
            <SidebarTrigger aria-label="Toggle sidebar" />
          </div>
        </header>

        {/* Sidebar */}
        <Sidebar className="mt-14">
          <UISidebarContent>
            <div className="overflow-y-auto">
              <MapSidebarContent />
            </div>
          </UISidebarContent>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 mt-14">
          <div className="h-[calc(100vh-3.5rem)] relative">
            <IntegratedMapInterface
              className="w-full h-full"
              farmId="demo-farm-001"
              farmName="Fazenda Técnica Demo"
              onPhotoCapture={(photoData, location) => {
                console.log('Photo captured successfully:', {
                  dataLength: photoData.length,
                  location: location ? `${location.latitude}, ${location.longitude}` : 'No location'
                });
              }}
              onMapStyleChange={(style) => {
                console.log('Map style changed to:', style);
              }}
            />
            
            {/* Floating Layer Selector */}
            <FloatingLayerSelector />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

// Mobile Layout Component
const MobileLayout = () => (
  <div className="min-h-screen bg-background">
    <MobileHeader />
    
    <div className="h-[calc(100vh-5rem)]">
      <IntegratedMapInterface
        className="w-full h-full"
        farmId="demo-farm-001"
        farmName="Fazenda Técnica Demo"
        onPhotoCapture={(photoData, location) => {
          console.log('Photo captured successfully:', {
            dataLength: photoData.length,
            location: location ? `${location.latitude}, ${location.longitude}` : 'No location'
          });
        }}
        onMapStyleChange={(style) => {
          console.log('Map style changed to:', style);
        }}
      />
      
      {/* Floating Layer Selector */}
      <FloatingLayerSelector />
    </div>
  </div>
);

const TechnicalMap = () => {
  const isMobile = useIsMobile();

  return (
    <MapProvider>
      <FullscreenTransitions>
        {isMobile ? <MobileLayout /> : <DesktopLayout />}
      </FullscreenTransitions>
    </MapProvider>
  );
};

export default TechnicalMap;