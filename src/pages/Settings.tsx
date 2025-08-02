import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Map, Camera, Navigation, DollarSign, Moon, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SyncIndicator from '@/components/ui/sync-indicator';
import { SyncService } from '@/services/syncService';
import { useToast } from '@/hooks/use-toast';
const Settings: React.FC = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  // Map Preferences
  const [defaultMapLayer, setDefaultMapLayer] = useState('satellite');

  // Permissions
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  // Units & Format
  const [defaultUnit, setDefaultUnit] = useState('brl');

  // Appearance
  const [darkMode, setDarkMode] = useState(false);
  const [isForceSyncing, setIsForceSyncing] = useState(false);
  const handleForceSync = async () => {
    setIsForceSyncing(true);
    try {
      const stats = await SyncService.forceSyncNow();
      if (stats.totalPending === 0) {
        toast({
          title: "Sincronização completa",
          description: "Todos os dados estão sincronizados",
          variant: "default"
        });
      } else {
        toast({
          title: "Sincronização iniciada",
          description: `${stats.totalPending} ${stats.totalPending === 1 ? 'arquivo sendo' : 'arquivos sendo'} sincronizado${stats.totalPending === 1 ? '' : 's'}`,
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsForceSyncing(false);
    }
  };
  const mapLayers = [{
    id: 'satellite',
    name: 'Satélite'
  }, {
    id: 'hybrid',
    name: 'Híbrido'
  }, {
    id: 'terrain',
    name: 'Terreno'
  }, {
    id: 'ndvi-sentinel',
    name: 'NDVI Sentinel'
  }, {
    id: 'ndvi-planet',
    name: 'NDVI Planet'
  }];
  const unitSystems = [{
    id: 'brl',
    name: 'R$ (Real Brasileiro)'
  }, {
    id: 'sack',
    name: 'Saca'
  }, {
    id: 'ton',
    name: 'Tonelada'
  }];
  return <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          
          <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
        </div>
        
        {/* Sync Indicator */}
        <SyncIndicator />
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6">
        
        {/* Map Preferences */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Map className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Preferências do Mapa</h2>
          </div>
          
          <Card className="p-4 shadow-ios-sm">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Camada padrão do mapa
                </label>
                <Select value={defaultMapLayer} onValueChange={setDefaultMapLayer}>
                  <SelectTrigger className="w-full h-12">
                    <SelectValue placeholder="Selecione a camada padrão" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border shadow-ios-lg z-50">
                    {mapLayers.map(layer => <SelectItem key={layer.id} value={layer.id} className="py-3">
                        {layer.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        {/* Permissions */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Navigation className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Permissões</h2>
          </div>
          
          <Card className="p-4 shadow-ios-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Navigation className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Permitir localização GPS</p>
                    <p className="text-sm text-muted-foreground">Necessário para mapeamento de campo</p>
                  </div>
                </div>
                <Switch checked={gpsEnabled} onCheckedChange={setGpsEnabled} />
              </div>

              <div className="h-px bg-border"></div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Camera className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Permitir acesso à câmera</p>
                    <p className="text-sm text-muted-foreground">Para captura de eventos no campo</p>
                  </div>
                </div>
                <Switch checked={cameraEnabled} onCheckedChange={setCameraEnabled} />
              </div>
            </div>
          </Card>
        </div>

        {/* Units & Format */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Unidades e Formato</h2>
          </div>
          
          <Card className="p-4 shadow-ios-sm">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Sistema de unidades padrão
                </label>
                <Select value={defaultUnit} onValueChange={setDefaultUnit}>
                  <SelectTrigger className="w-full h-12">
                    <SelectValue placeholder="Selecione o sistema de unidades" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border shadow-ios-lg z-50">
                    {unitSystems.map(unit => <SelectItem key={unit.id} value={unit.id} className="py-3">
                        {unit.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        {/* Appearance */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Moon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Aparência</h2>
          </div>
          
          <Card className="p-4 shadow-ios-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Moon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Modo escuro</p>
                  <p className="text-sm text-muted-foreground">Ativar tema escuro do aplicativo</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
          </Card>
        </div>

        {/* Sync Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Sincronização</h2>
          </div>
          
          <Card className="p-4 shadow-ios-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Forçar sincronização</p>
                  <p className="text-sm text-muted-foreground">Sincronizar todos os dados pendentes agora</p>
                </div>
              </div>
              <Button onClick={handleForceSync} disabled={isForceSyncing} variant="outline" size="sm" className="min-w-[100px]">
                <RefreshCw className={`h-4 w-4 mr-2 ${isForceSyncing ? 'animate-spin' : ''}`} />
                {isForceSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Spacer */}
        <div className="h-8"></div>

        {/* Logout */}
        <Card className="shadow-ios-md">
          <Button onClick={() => navigate('/login-mapa')} variant="ghost" className="w-full h-14 text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center justify-center space-x-3">
            <LogOut className="h-5 w-5" />
            <span className="font-semibold text-base">Sair do FlowAgro</span>
          </Button>
        </Card>
      </div>
    </div>;
};
export default Settings;