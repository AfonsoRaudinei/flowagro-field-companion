import React, { useState } from 'react';
import { 
  MapPin, 
  MessageSquare, 
  Settings, 
  Search, 
  Bell, 
  Layers, 
  Thermometer, 
  Droplets, 
  Wind,
  BarChart3,
  Camera,
  Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NavigationHeader } from '@/components/ui/navigation';
import { BottomTabs } from '@/components/ui/navigation';

interface MainDashboardProps {
  onNavigateToChat: () => void;
  onNavigateToSettings: () => void;
}

const MainDashboard: React.FC<MainDashboardProps> = ({ 
  onNavigateToChat, 
  onNavigateToSettings 
}) => {
  const [activeTab, setActiveTab] = useState('map');

  const tabs = [
    { id: 'map', label: 'Mapa', icon: MapPin },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'settings', label: 'Config', icon: Settings }
  ];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'chat') {
      onNavigateToChat();
    } else if (tab === 'settings') {
      onNavigateToSettings();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavigationHeader
        title="FlowAgro"
        showBackButton={false}
        rightActions={
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Bell className="h-5 w-5" />
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="p-4 bg-card border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar área, propriedade..."
            className="pl-10 h-12"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 pb-20 space-y-4">
        {/* Map Area */}
        <Card className="h-64 bg-gradient-subtle relative overflow-hidden shadow-ios-md">
          {/* Simulated Map */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-secondary/30">
            <div className="absolute inset-0 opacity-20">
              <div className="grid grid-cols-12 grid-rows-8 h-full w-full gap-1 p-4">
                {Array.from({ length: 96 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${
                      Math.random() > 0.8 
                        ? 'bg-success' 
                        : Math.random() > 0.6 
                        ? 'bg-warning' 
                        : 'bg-primary'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 space-y-2">
            <Button variant="secondary" size="sm" className="h-10 w-10 p-0 shadow-ios-sm">
              <Layers className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" className="h-10 w-10 p-0 shadow-ios-sm">
              <Navigation className="h-4 w-4" />
            </Button>
          </div>

          {/* Map Info */}
          <div className="absolute bottom-4 left-4">
            <Badge className="bg-card/90 text-foreground shadow-ios-sm">
              Propriedade Rural - Setor A
            </Badge>
          </div>
        </Card>

        {/* Weather & Conditions */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center shadow-ios-sm">
            <Thermometer className="h-6 w-6 text-warning mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">28°C</p>
            <p className="text-xs text-muted-foreground">Temperatura</p>
          </Card>
          
          <Card className="p-4 text-center shadow-ios-sm">
            <Droplets className="h-6 w-6 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">65%</p>
            <p className="text-xs text-muted-foreground">Umidade</p>
          </Card>
          
          <Card className="p-4 text-center shadow-ios-sm">
            <Wind className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">12km/h</p>
            <p className="text-xs text-muted-foreground">Vento</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-4 shadow-ios-md">
          <h3 className="font-semibold text-foreground mb-3">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-16 flex flex-col items-center justify-center space-y-1"
            >
              <Camera className="h-5 w-5" />
              <span className="text-xs">Capturar</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 flex flex-col items-center justify-center space-y-1"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs">Relatório</span>
            </Button>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-4 shadow-ios-md">
          <h3 className="font-semibold text-foreground mb-3">Atividade Recente</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Análise de solo - Setor B
                </p>
                <p className="text-xs text-muted-foreground">Há 2 horas</p>
              </div>
              <Badge variant="secondary">Concluído</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Monitoramento climático
                </p>
                <p className="text-xs text-muted-foreground">Há 1 dia</p>
              </div>
              <Badge variant="outline">Pendente</Badge>
            </div>
          </div>
        </Card>
      </div>

      <BottomTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={tabs}
      />
    </div>
  );
};

export default MainDashboard;