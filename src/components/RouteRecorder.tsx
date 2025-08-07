import React, { useState, useEffect } from 'react';
import { TrailService, Trail } from '@/services/trailService';
import { CameraService } from '@/services/cameraService';
import { Play, Pause, Square, Camera, MapPin, Clock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface RouteRecorderProps {
  farmId: string;
  farmName: string;
  isVisible: boolean;
  onTrailUpdate?: (trail: Trail) => void;
  onTrailComplete?: (trail: Trail) => void;
}

export const RouteRecorder: React.FC<RouteRecorderProps> = ({
  farmId,
  farmName,
  isVisible,
  onTrailUpdate,
  onTrailComplete
}) => {
  const [currentTrail, setCurrentTrail] = useState<Trail | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing active trail
    const activeTrail = TrailService.getCurrentTrail();
    if (activeTrail?.isActive) {
      setCurrentTrail(activeTrail);
      setIsRecording(true);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && currentTrail) {
      interval = setInterval(() => {
        const start = new Date(currentTrail.startTime);
        const now = new Date();
        setElapsedTime(Math.floor((now.getTime() - start.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, currentTrail]);

  const startRecording = async () => {
    try {
      const trail = await TrailService.startTrailRecording(
        farmId,
        farmName,
        (updatedTrail) => {
          setCurrentTrail(updatedTrail);
          onTrailUpdate?.(updatedTrail);
        }
      );
      
      setCurrentTrail(trail);
      setIsRecording(true);
      
      toast({
        title: "Gravação iniciada",
        description: "Rota sendo gravada em tempo real",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro ao iniciar gravação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const pauseRecording = () => {
    // TODO: Implement pause functionality in TrailService
    setIsRecording(false);
    toast({
      title: "Gravação pausada",
      description: "Toque em 'Continuar' para retomar",
      variant: "default"
    });
  };

  const stopRecording = async () => {
    try {
      const completedTrail = await TrailService.stopTrailRecording();
      if (completedTrail) {
        setCurrentTrail(null);
        setIsRecording(false);
        setElapsedTime(0);
        onTrailComplete?.(completedTrail);
        
        toast({
          title: "Rota finalizada",
          description: `Distância: ${TrailService.formatDistance(completedTrail.totalDistance || 0)}`,
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao finalizar rota",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const captureWaypoint = async () => {
    try {
      const photo = await CameraService.takePhoto();
      const location = await CameraService.getCurrentLocation();
      
      if (photo && location && currentTrail) {
        // Create waypoint photo
        const waypointPhoto = {
          id: `waypoint-${Date.now()}`,
          farmId,
          farmName,
          eventType: 'outro' as const,
          eventLabel: 'Ponto de interesse na rota',
          imagePath: photo,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date(),
          severity: 'medio' as const,
          notes: `Ponto capturado durante rota ${currentTrail.id}`
        };
        
        await CameraService.savePhoto(waypointPhoto);
        
        toast({
          title: "Ponto de interesse salvo",
          description: "Foto adicionada à rota",
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao capturar ponto",
        description: "Não foi possível salvar o ponto de interesse",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <Card className="absolute bottom-20 left-4 right-4 p-4 bg-background/95 backdrop-blur-sm border shadow-lg z-50">
      <div className="space-y-4">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-semibold">Gravação de Rota</span>
            <Badge variant={isRecording ? "default" : "secondary"}>
              {isRecording ? "Gravando" : "Pausado"}
            </Badge>
          </div>
        </div>

        {/* Stats Display */}
        {currentTrail && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {TrailService.formatDistance(currentTrail.totalDistance || 0)}
              </div>
              <div className="text-xs text-muted-foreground">Distância</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-xs text-muted-foreground">Tempo</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {currentTrail.points.length}
              </div>
              <div className="text-xs text-muted-foreground">Pontos</div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!currentTrail ? (
            <Button onClick={startRecording} className="flex-1" size="lg">
              <Play className="h-4 w-4 mr-2" />
              Iniciar Gravação
            </Button>
          ) : (
            <>
              <Button
                onClick={isRecording ? pauseRecording : startRecording}
                variant={isRecording ? "secondary" : "default"}
                className="flex-1"
                size="lg"
              >
                {isRecording ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Continuar
                  </>
                )}
              </Button>
              <Button onClick={stopRecording} variant="destructive" size="lg">
                <Square className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
            </>
          )}
          
          {currentTrail && (
            <Button onClick={captureWaypoint} variant="outline" size="lg">
              <Camera className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Farm Info */}
        <div className="text-xs text-muted-foreground text-center">
          <MapPin className="h-3 w-3 inline mr-1" />
          {farmName}
        </div>
      </div>
    </Card>
  );
};