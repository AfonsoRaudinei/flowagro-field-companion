import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { SimpleBaseMap } from "@/components/maps/SimpleBaseMap";

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
    <div 
      className="min-h-screen relative overflow-hidden"
      onWheel={handleSwipeOrScroll}
      onTouchStart={handleSwipeOrScroll}
    >
      {/* Full-screen Map Background */}
      <div className="absolute inset-0">
        <SimpleBaseMap 
          className="w-full h-full"
          center={[-47.8825, -15.7942]} // Brasília coordinates
          zoom={5}
          showNativeControls={false}
        />
        {/* Subtle overlay for better contrast */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Floating Login Button */}
      <div className="absolute bottom-8 right-8 z-50">
        <Button
          onClick={handleLoginClick}
          size="lg"
          className="rounded-full w-16 h-16 p-0 shadow-2xl hover:shadow-3xl transition-all duration-300 animate-pulse hover:animate-none"
        >
          <LogIn className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default TelaInicial;