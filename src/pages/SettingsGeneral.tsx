import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  MapPin,
  MessageSquare,
  Settings as SettingsIcon,
  Moon,
  Globe,
  Smartphone,
  Download,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { NavigationHeader } from '@/components/ui/navigation';
import { BottomTabs } from '@/components/ui/navigation';

interface SettingsGeneralProps {
  onBack: () => void;
  onNavigateToMap: () => void;
  onNavigateToChat: () => void;
  onLogout: () => void;
}

const SettingsGeneral: React.FC<SettingsGeneralProps> = ({ 
  onBack, 
  onNavigateToMap, 
  onNavigateToChat,
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState('settings');
  const [notifications, setNotifications] = useState(true);
  const [locationAccess, setLocationAccess] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  const tabs = [
    { id: 'map', label: 'Mapa', icon: MapPin },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'settings', label: 'Config', icon: SettingsIcon }
  ];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'map') {
      onNavigateToMap();
    } else if (tab === 'chat') {
      onNavigateToChat();
    }
  };

  const settingsItems = [
    {
      section: 'Conta',
      items: [
        {
          icon: User,
          title: 'Perfil do usuário',
          subtitle: 'Editar informações pessoais',
          action: () => console.log('Profile')
        },
        {
          icon: Bell,
          title: 'Notificações',
          subtitle: 'Configurar alertas e avisos',
          action: () => console.log('Notifications'),
          toggle: true,
          value: notifications,
          onChange: setNotifications
        }
      ]
    },
    {
      section: 'Aplicativo',
      items: [
        {
          icon: Globe,
          title: 'Acesso à localização',
          subtitle: 'Permitir GPS para mapeamento',
          toggle: true,
          value: locationAccess,
          onChange: setLocationAccess
        },
        {
          icon: Download,
          title: 'Sincronização automática',
          subtitle: 'Sync dados quando conectado',
          toggle: true,
          value: autoSync,
          onChange: setAutoSync
        },
        {
          icon: Smartphone,
          title: 'Configurações do dispositivo',
          subtitle: 'Preferências de hardware',
          action: () => console.log('Device settings')
        }
      ]
    },
    {
      section: 'Suporte',
      items: [
        {
          icon: HelpCircle,
          title: 'Central de ajuda',
          subtitle: 'FAQ e tutoriais',
          action: () => console.log('Help')
        },
        {
          icon: Shield,
          title: 'Privacidade e segurança',
          subtitle: 'Termos de uso e políticas',
          action: () => console.log('Privacy')
        }
      ]
    },
    {
      section: 'Dados',
      items: [
        {
          icon: Trash2,
          title: 'Limpar cache',
          subtitle: 'Liberar espaço de armazenamento',
          action: () => console.log('Clear cache'),
          destructive: true
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavigationHeader
        title="Configurações"
        onBack={onBack}
        showBackButton={true}
      />

      <div className="flex-1 pb-20">
        {/* User Profile Section */}
        <div className="p-6 bg-card border-b border-border">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" alt="User" />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground">João Silva</h2>
              <p className="text-muted-foreground">Produtor Rural</p>
              <p className="text-sm text-muted-foreground">joao.silva@flowagro.com</p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="p-4 space-y-6">
          {settingsItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="text-lg font-semibold text-foreground mb-3 px-2">
                {section.section}
              </h3>
              <Card className="shadow-ios-sm">
                <div className="divide-y divide-border">
                  {section.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={itemIndex}
                        className={`p-4 flex items-center justify-between hover:bg-accent/50 transition-colors ${
                          item.action && !item.toggle ? 'cursor-pointer' : ''
                        }`}
                        onClick={item.action && !item.toggle ? item.action : undefined}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            item.destructive 
                              ? 'bg-destructive/10'
                              : 'bg-primary/10'
                          }`}>
                            <Icon className={`h-5 w-5 ${
                              item.destructive 
                                ? 'text-destructive'
                                : 'text-primary'
                            }`} />
                          </div>
                          <div>
                            <p className={`font-medium ${
                              item.destructive 
                                ? 'text-destructive'
                                : 'text-foreground'
                            }`}>
                              {item.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                        
                        {item.toggle ? (
                          <Switch
                            checked={item.value}
                            onCheckedChange={item.onChange}
                          />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          ))}

          {/* App Info */}
          <Card className="p-4 shadow-ios-sm">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto bg-gradient-primary rounded-xl flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <p className="font-semibold text-foreground">FlowAgro</p>
              <p className="text-sm text-muted-foreground">Versão 1.0.0</p>
              <p className="text-xs text-muted-foreground">
                © 2024 FlowAgro Technologies
              </p>
            </div>
          </Card>

          {/* Logout Button */}
          <Card className="shadow-ios-sm">
            <Button
              onClick={onLogout}
              variant="ghost"
              className="w-full h-14 text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center justify-center space-x-2"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sair da conta</span>
            </Button>
          </Card>
        </div>
      </div>

      <BottomTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={tabs}
      />
    </div>
  );
};

export default SettingsGeneral;