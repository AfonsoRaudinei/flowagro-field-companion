import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { CalendarIcon, CloudIcon, SatelliteIcon, ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type LayerType = 'ndvi' | 'true-color' | 'false-color' | 'visual' | 'analytic';
type DataSource = 'sentinel' | 'planet';

interface SatelliteLayer {
  id: string;
  name: string;
  type: LayerType;
  source: DataSource;
  description: string;
  icon: React.ReactNode;
}

interface SatelliteLayerSelectorProps {
  bbox: [number, number, number, number];
  onLayerLoad: (imageUrl: string, metadata: any) => void;
  className?: string;
}

const SATELLITE_LAYERS: SatelliteLayer[] = [
  {
    id: 'sentinel-ndvi',
    name: 'NDVI (Sentinel-2)',
    type: 'ndvi',
    source: 'sentinel',
    description: 'Índice de vegetação para análise de saúde das plantas',
    icon: <SatelliteIcon className="h-4 w-4" />
  },
  {
    id: 'sentinel-true-color',
    name: 'Cor Verdadeira (Sentinel-2)',
    type: 'true-color',
    source: 'sentinel',
    description: 'Imagem em cores naturais',
    icon: <ImageIcon className="h-4 w-4" />
  },
  {
    id: 'sentinel-false-color',
    name: 'Falsa Cor (Sentinel-2)',
    type: 'false-color',
    source: 'sentinel',
    description: 'Imagem em falsa cor para análise de vegetação',
    icon: <ImageIcon className="h-4 w-4" />
  },
  {
    id: 'planet-visual',
    name: 'Alta Resolução (Planet)',
    type: 'visual',
    source: 'planet',
    description: 'Imagem de alta resolução Planet Labs',
    icon: <SatelliteIcon className="h-4 w-4" />
  },
  {
    id: 'planet-analytic',
    name: 'Analítica (Planet)',
    type: 'analytic',
    source: 'planet',
    description: 'Dados analíticos para processamento avançado',
    icon: <SatelliteIcon className="h-4 w-4" />
  }
];

export const SatelliteLayerSelector: React.FC<SatelliteLayerSelectorProps> = ({
  bbox,
  onLayerLoad,
  className = ""
}) => {
  const [selectedLayer, setSelectedLayer] = useState<string>('sentinel-ndvi');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [opacity, setOpacity] = useState<number[]>([80]);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleLoadLayer = async () => {
    const layer = SATELLITE_LAYERS.find(l => l.id === selectedLayer);
    if (!layer) return;

    setLoading(true);
    try {
      console.log(`Carregando camada ${layer.name} para data ${selectedDate}`);
      
      if (layer.source === 'sentinel') {
        const { data, error } = await supabase.functions.invoke('sentinel-hub', {
          body: {
            bbox,
            date: selectedDate,
            layerType: layer.type,
            width: 512,
            height: 512
          }
        });

        if (error) {
          console.error('Erro Sentinel Hub:', error);
          throw new Error('Falha ao carregar imagem Sentinel');
        }

        // Convert blob to URL for display
        const imageBlob = new Blob([data], { type: 'image/png' });
        const imageUrl = URL.createObjectURL(imageBlob);
        
        setLastResult({
          source: 'Sentinel-2',
          type: layer.name,
          date: selectedDate,
          resolution: '10m'
        });

        onLayerLoad(imageUrl, {
          source: 'sentinel',
          type: layer.type,
          date: selectedDate,
          opacity: opacity[0] / 100
        });

        toast({
          title: "Camada carregada",
          description: `${layer.name} para ${selectedDate}`
        });

      } else if (layer.source === 'planet') {
        const { data, error } = await supabase.functions.invoke('planet-labs', {
          body: {
            bbox,
            date: selectedDate,
            layerType: layer.type,
            cloudCover: 0.3
          }
        });

        if (error) {
          console.error('Erro Planet Labs:', error);
          throw new Error('Falha ao carregar imagem Planet');
        }

        setLastResult({
          source: 'Planet Labs',
          type: layer.name,
          date: selectedDate,
          cloudCover: data.cloudCover,
          imageId: data.imageId
        });

        // Planet Labs returns metadata for now
        toast({
          title: "Metadados Planet carregados",
          description: `Imagem ${data.imageId} - ${(data.cloudCover * 100).toFixed(1)}% nuvens`
        });
      }

    } catch (error) {
      console.error('Erro ao carregar camada:', error);
      toast({
        title: "Erro ao carregar camada",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedLayerData = SATELLITE_LAYERS.find(l => l.id === selectedLayer);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <SatelliteIcon className="h-4 w-4" />
          Camadas de Satélite
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seletor de Camada */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Tipo de Imagem</label>
          <Select value={selectedLayer} onValueChange={setSelectedLayer}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SATELLITE_LAYERS.map(layer => (
                <SelectItem key={layer.id} value={layer.id}>
                  <div className="flex items-center gap-2">
                    {layer.icon}
                    <div className="flex flex-col">
                      <span className="text-sm">{layer.name}</span>
                      <span className="text-xs text-muted-foreground">{layer.description}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seletor de Data */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            Data da Imagem
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
          />
        </div>

        {/* Controle de Opacidade */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Opacidade: {opacity[0]}%
          </label>
          <Slider
            value={opacity}
            onValueChange={setOpacity}
            max={100}
            min={0}
            step={10}
            className="w-full"
          />
        </div>

        {/* Preview da Camada Selecionada */}
        {selectedLayerData && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {selectedLayerData.icon}
              <span className="text-sm font-medium">{selectedLayerData.name}</span>
              <Badge variant="outline" className="text-xs">
                {selectedLayerData.source === 'sentinel' ? 'Sentinel-2' : 'Planet Labs'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{selectedLayerData.description}</p>
          </div>
        )}

        {/* Botão de Carregar */}
        <Button 
          onClick={handleLoadLayer} 
          disabled={loading}
          className="w-full"
          size="sm"
        >
          {loading ? 'Carregando...' : 'Carregar Camada'}
        </Button>

        {/* Resultado da Última Camada */}
        {lastResult && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="text-xs font-medium text-primary mb-1">Última Camada Carregada:</div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Fonte:</span>
                <span className="font-medium">{lastResult.source}</span>
              </div>
              <div className="flex justify-between">
                <span>Tipo:</span>
                <span className="font-medium">{lastResult.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Data:</span>
                <span className="font-medium">{lastResult.date}</span>
              </div>
              {lastResult.cloudCover !== undefined && (
                <div className="flex justify-between items-center">
                  <span>Nuvens:</span>
                  <div className="flex items-center gap-1">
                    <CloudIcon className="h-3 w-3" />
                    <span className="font-medium">{(lastResult.cloudCover * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}
              {lastResult.resolution && (
                <div className="flex justify-between">
                  <span>Resolução:</span>
                  <span className="font-medium">{lastResult.resolution}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};