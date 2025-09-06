import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogIn, MapPin, CheckCircle } from "lucide-react";
import { SimpleBaseMap } from "@/components/maps/SimpleBaseMap";
import { Geolocation } from '@capacitor/geolocation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { logger } from '@/lib/logger';

const TelaInicial = () => {
  const navigate = useNavigate();
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
        return;
      }
      
      // Check if location permission was already requested
      const locationRequested = localStorage.getItem('flowagro-location-permission-requested');
      if (!locationRequested) {
        setShowLocationDialog(true);
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleLoginClick = () => {
    navigate("/login-form");
  };

  const handleLocationPermission = async () => {
    setIsRequestingLocation(true);
    try {
      await Geolocation.requestPermissions();
      const position = await Geolocation.getCurrentPosition();
      const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
      setUserLocation(coords);
      logger.businessLogic('Location granted', { position: { lat: position.coords.latitude, lng: position.coords.longitude } });
      localStorage.setItem('flowagro-location-permission-requested', 'granted');
    } catch (error) {
      logger.warn('Location permission denied or failed', { error });
      localStorage.setItem('flowagro-location-permission-requested', 'denied');
    } finally {
      setIsRequestingLocation(false);
      setShowLocationDialog(false);
    }
  };

  const handleLocationDecline = () => {
    localStorage.setItem('flowagro-location-permission-requested', 'denied');
    setShowLocationDialog(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full-screen Map Background */}
      <div className="absolute inset-0">
        <SimpleBaseMap 
          className="w-full h-full"
          center={userLocation || [-47.8825, -15.7942]} // User location or Brasília
          zoom={userLocation ? 15 : 5}
          showNativeControls={false}
          showUserMarker={!!userLocation}
        />
        {/* Subtle overlay for better contrast */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Location Permission Dialog */}
      <AlertDialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <AlertDialogContent className="max-w-md mx-auto">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-primary/10">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <AlertDialogTitle className="text-xl">
                Permitir Acesso à Localização
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              O FlowAgro usa sua localização para fornecer informações precisas sobre suas propriedades rurais, 
              condições meteorológicas locais e otimizar suas operações agrícolas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleLocationDecline} className="w-full sm:w-auto">
              Não Agora
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLocationPermission}
              disabled={isRequestingLocation}
              className="w-full sm:w-auto"
            >
              {isRequestingLocation ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  Solicitando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Permitir
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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