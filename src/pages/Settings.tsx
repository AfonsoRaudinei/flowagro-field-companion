import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Map,
  Camera,
  Navigation,
  DollarSign,
  Moon,
  LogOut,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  // Map Preferences
  const [defaultMapLayer, setDefaultMapLayer] = useState('satellite');
  
  // Permissions
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  
  // Units & Format
  const [defaultUnit, setDefaultUnit] = useState('brl');
  
  // Appearance
  const [darkMode, setDarkMode] = useState(false);

  const mapLayers = [
    { id: 'satellite', name: 'Satélite' },
    { id: 'hybrid', name: 'Híbrido' },
    { id: 'terrain', name: 'Terreno' },
    { id: 'ndvi-sentinel', name: 'NDVI Sentinel' },
    { id: 'ndvi-planet', name: 'NDVI Planet' }
  ];

  const unitSystems = [
    { id: 'brl', name: 'R$ (Real Brasileiro)' },
    { id: 'sack', name: 'Saca' },
    { id: 'ton', name: 'Tonelada' }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => navigate('/technical-map')}
            variant="ghost"
            size="icon"
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">
            Configurações
          </h1>
        </div>
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
                    {mapLayers.map((layer) => (
                      <SelectItem key={layer.id} value={layer.id} className="py-3">
                        {layer.name}
                      </SelectItem>
                    ))}
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
                <Switch
                  checked={gpsEnabled}
                  onCheckedChange={setGpsEnabled}
                />
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
                <Switch
                  checked={cameraEnabled}
                  onCheckedChange={setCameraEnabled}
                />
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
                    {unitSystems.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id} className="py-3">
                        {unit.name}
                      </SelectItem>
                    ))}
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
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
          </Card>
        </div>

        {/* Spacer */}
        <div className="h-8"></div>

        {/* Logout */}
        <Card className="shadow-ios-md">
          <Button
            onClick={() => navigate('/login-mapa')}
            variant="ghost"
            className="w-full h-14 text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center justify-center space-x-3"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-semibold text-base">Sair do FlowAgro</span>
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Settings;