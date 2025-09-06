import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnifiedMap, type MapConfig } from '@/components/maps';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const TelaInicial = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        navigate('/dashboard');
        return;
      }
    };

    checkSession();
  }, [navigate]);

  // Configuration for landing page map
  const mapConfig: MapConfig = {
    showLoginButton: true,
    showLocationDialog: true,
    showNativeControls: false,
    overlayOpacity: 0.2,
    enableLocationPermission: true,
    initialZoom: 15
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <UnifiedMap 
        config={mapConfig}
        className="w-full h-full"
      />
    </div>
  );
};

export default TelaInicial;