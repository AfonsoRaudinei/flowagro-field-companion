import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MapProvider } from "@/components/maps/MapProvider";
import { BaseMap } from "@/components/maps/BaseMap";
import { LogIn } from "lucide-react";

const TelaInicial = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleLoginClick = () => {
    navigate("/login-form");
  };

  const handleSwipeOrScroll = (event: React.WheelEvent | React.TouchEvent) => {
    // Navigate to login on scroll down or swipe up
    if ('deltaY' in event && event.deltaY > 0) {
      navigate("/login-form");
    } else if ('touches' in event && event.touches.length === 1) {
      // Handle touch events for swipe
      navigate("/login-form");
    }
  };

  return (
    <MapProvider>
      <div 
        className="min-h-screen flex flex-col relative overflow-hidden"
        onWheel={handleSwipeOrScroll}
        onTouchStart={handleSwipeOrScroll}
      >
        {/* Map Background */}
        <div className="absolute inset-0">
          <BaseMap 
            className="w-full h-full"
            showNavigation={false}
            showFullscreen={false}
            showGeolocate={false}
            interactive={false}
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background/50 to-secondary/30" />
        </div>

        {/* Logo/Brand */}
        <div className="absolute top-8 left-8 z-10">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">FlowAgro</h1>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-8 z-10">
          <div className="text-center space-y-6 max-w-lg">
            <h2 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
              Bem-vindo ao FlowAgro
            </h2>
            <p className="text-lg text-white/90 drop-shadow">
              Sua plataforma completa para gestão agrícola inteligente
            </p>
          </div>
        </div>

        {/* Login Button */}
        <div className="absolute bottom-8 right-8 z-10">
          <Button
            onClick={handleLoginClick}
            size="lg"
            className="rounded-full w-16 h-16 p-0 text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <LogIn className="w-6 h-6" />
          </Button>
        </div>

        {/* Saiba mais link */}
        <div className="absolute bottom-8 left-8 z-10">
          <button 
            className="text-sm text-white/80 hover:text-white transition-colors drop-shadow"
            onClick={() => navigate("/technical-map")}
          >
            Saiba mais
          </button>
        </div>
      </div>
    </MapProvider>
  );
};

export default TelaInicial;