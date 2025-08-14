import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import MapView from "@/components/map/MapView";

const TelaInicial = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard", { replace: true });
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleLoginClick = () => {
    navigate("/login-form");
  };

  const handleSwipeOrScroll = (e: React.TouchEvent | React.WheelEvent) => {
    if ('deltaY' in e && e.deltaY > 0) {
      // Scroll down
      navigate("/login-form");
    } else if ('touches' in e) {
      // Touch event - handle swipe up
      const touch = e.touches[0];
      if (touch) {
        const startY = touch.clientY;
        const handleTouchEnd = (endEvent: TouchEvent) => {
          const endY = endEvent.changedTouches[0].clientY;
          if (startY - endY > 50) { // Swipe up
            navigate("/login-form");
          }
          document.removeEventListener('touchend', handleTouchEnd);
        };
        document.addEventListener('touchend', handleTouchEnd);
      }
    }
  };

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      onWheel={handleSwipeOrScroll}
      onTouchStart={handleSwipeOrScroll}
    >
      {/* Fullscreen satellite map background */}
      <div className="absolute inset-0">
        <MapView
          center={[-14.235, -51.925]}
          zoom={5}
          baseLayerId="satellite"
          markers={[]}
        />
      </div>
      
      {/* Background overlay with gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />
      
      {/* Logo FlowAgro - Superior esquerdo */}
      <div className="absolute top-8 left-6 z-10">
        <h1 className="text-2xl font-bold text-white drop-shadow-lg">
          FlowAgro
        </h1>
      </div>

      {/* Mensagem de boas-vindas centralizada */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
          Bem-vindo ao FlowAgro
        </h2>
        <p className="text-lg md:text-xl text-white/90 max-w-md drop-shadow-md">
          Tecnologia para o campo na palma da sua mão
        </p>
      </div>

      {/* Botão circular verde - Inferior direito */}
      <div className="absolute bottom-8 right-6 z-10">
        <Button
          onClick={handleLoginClick}
          size="lg"
          className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 shadow-lg transition-all duration-200 active:scale-95"
          aria-label="Fazer login"
        >
          <LogIn className="w-6 h-6 text-primary-foreground" />
        </Button>
      </div>

      {/* Link auxiliar discreto */}
      <div className="absolute bottom-8 left-6 z-10">
        <button 
          onClick={() => navigate("/login-form")}
          className="text-sm text-white/70 hover:text-white transition-colors underline"
        >
          Saiba mais
        </button>
      </div>
    </div>
  );
};

export default TelaInicial;