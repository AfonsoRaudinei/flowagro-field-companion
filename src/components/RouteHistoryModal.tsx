import React, { useState, useEffect } from 'react';
import { TrailService, Trail } from '@/services/trailService';
import { CameraService, FieldPhoto } from '@/services/cameraService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Route, Calendar, Clock, MapPin, Camera, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RouteHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmId?: string;
  onViewRoute?: (trail: Trail) => void;
}

export const RouteHistoryModal: React.FC<RouteHistoryModalProps> = ({
  isOpen,
  onClose,
  farmId,
  onViewRoute
}) => {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [trailPhotos, setTrailPhotos] = useState<Record<string, FieldPhoto[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTrails();
    }
  }, [isOpen, farmId]);

  const loadTrails = async () => {
    setLoading(true);
    try {
      const storedTrails = farmId 
        ? await TrailService.getTrailsByFarm(farmId)
        : await TrailService.getStoredTrails();
      
      // Sort by date (newest first)
      const sortedTrails = storedTrails.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      
      setTrails(sortedTrails);

      // Load photos for each trail
      const photosMap: Record<string, FieldPhoto[]> = {};
      for (const trail of sortedTrails) {
        try {
          const farmPhotos = await CameraService.getPhotosByFarm(trail.farmId);
          // Filter photos that were taken during the trail time
          const trailStartTime = new Date(trail.startTime).getTime();
          const trailEndTime = trail.endTime ? new Date(trail.endTime).getTime() : Date.now();
          
          const relevantPhotos = farmPhotos.filter(photo => {
            const photoTime = new Date(photo.timestamp).getTime();
            return photoTime >= trailStartTime && photoTime <= trailEndTime;
          });
          
          photosMap[trail.id] = relevantPhotos;
        } catch (error) {
          console.error('Error loading photos for trail:', trail.id, error);
          photosMap[trail.id] = [];
        }
      }
      
      setTrailPhotos(photosMap);
    } catch (error) {
      console.error('Error loading trails:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageSpeed = (trail: Trail): string => {
    if (!trail.endTime || !trail.totalDistance) return '0 km/h';
    
    const durationHours = (new Date(trail.endTime).getTime() - new Date(trail.startTime).getTime()) / (1000 * 60 * 60);
    const distanceKm = trail.totalDistance / 1000;
    const avgSpeed = distanceKm / durationHours;
    
    return `${avgSpeed.toFixed(1)} km/h`;
  };

  const getTrailDuration = (trail: Trail): string => {
    if (!trail.endTime) return 'Em andamento';
    return TrailService.formatDuration(trail.startTime, trail.endTime);
  };

  const TrailCard: React.FC<{ trail: Trail }> = ({ trail }) => {
    const photos = trailPhotos[trail.id] || [];
    
    return (
      <Card className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-primary" />
              <span className="font-semibold">{trail.farmName}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(trail.startTime), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(trail.startTime), 'HH:mm', { locale: ptBR })}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewRoute?.(trail)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Ver
          </Button>
        </div>

        <Separator />

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-primary">
              {TrailService.formatDistance(trail.totalDistance || 0)}
            </div>
            <div className="text-xs text-muted-foreground">Distância</div>
          </div>
          <div>
            <div className="text-lg font-bold text-primary">
              {getTrailDuration(trail)}
            </div>
            <div className="text-xs text-muted-foreground">Duração</div>
          </div>
          <div>
            <div className="text-lg font-bold text-primary">
              {calculateAverageSpeed(trail)}
            </div>
            <div className="text-xs text-muted-foreground">Vel. Média</div>
          </div>
        </div>

        {photos.length > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {photos.length} foto{photos.length !== 1 ? 's' : ''} capturada{photos.length !== 1 ? 's' : ''}
                </span>
              </div>
              <Badge variant="secondary">{trail.points.length} pontos GPS</Badge>
            </div>
          </>
        )}
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Histórico de Rotas
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando rotas...
              </div>
            ) : trails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma rota encontrada</p>
                <p className="text-sm">Grave sua primeira rota para vê-la aqui</p>
              </div>
            ) : (
              trails.map((trail) => (
                <TrailCard key={trail.id} trail={trail} />
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};