import React, { useState } from 'react';
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
} from '@/components/ui/alert-dialog';
import { logger } from '@/lib/logger';

interface LocationDialogProps {
  show: boolean;
  onLocationGranted: (location: [number, number]) => void;
  onClose: () => void;
}

export const LocationDialog: React.FC<LocationDialogProps> = ({
  show,
  onLocationGranted,
  onClose
}) => {
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const handleLocationPermission = async () => {
    setIsRequestingLocation(true);
    try {
      await Geolocation.requestPermissions();
      const position = await Geolocation.getCurrentPosition();
      const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
      
      onLocationGranted(coords);
      
      logger.businessLogic('Location granted', { 
        position: { 
          lat: position.coords.latitude, 
          lng: position.coords.longitude 
        } 
      });
      
      localStorage.setItem('flowagro-location-permission-requested', 'granted');
      onClose();
    } catch (error) {
      logger.error('Location permission error', { error });
      localStorage.setItem('flowagro-location-permission-requested', 'denied');
      onClose();
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const handleLocationDecline = () => {
    localStorage.setItem('flowagro-location-permission-requested', 'denied');
    onClose();
  };

  return (
    <AlertDialog open={show} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Permitir Acesso à Localização</AlertDialogTitle>
          <AlertDialogDescription>
            O FlowAgro precisa acessar sua localização para mostrar mapas e dados agrícolas 
            relevantes para sua região. Isso nos ajuda a fornecer informações mais precisas 
            sobre suas culturas e condições locais.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={handleLocationDecline}
            disabled={isRequestingLocation}
          >
            Não Permitir
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleLocationPermission}
            disabled={isRequestingLocation}
          >
            {isRequestingLocation ? 'Obtendo localização...' : 'Permitir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};