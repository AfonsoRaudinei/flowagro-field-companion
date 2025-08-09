import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Map, Camera, Navigation, DollarSign, Moon, LogOut, RefreshCw, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SyncIndicator from '@/components/ui/sync-indicator';
import { SyncService } from '@/services/syncService';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { FirebaseAuthService } from '@/services/firebaseAuthService';
import { UserSettingsService, UserSettings } from '@/services/userSettingsService';
import { setAppName, setFavicon } from '@/lib/branding';
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

  // User & Branding
  const [userId, setUserId] = useState<string | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | undefined>();
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [appName, setAppNameState] = useState<string>('');
  const [useLogoAsIcon, setUseLogoAsIcon] = useState<boolean>(false);
  const fileInputProfileRef = useRef<HTMLInputElement>(null);
  const fileInputLogoRef = useRef<HTMLInputElement>(null);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    const authUser = FirebaseAuthService.getCurrentUser();
    if (authUser) {
      setUserId(authUser.uid);
      UserSettingsService.get(authUser.uid)
        .then((settings) => {
          if (settings) {
            setProfilePhotoUrl(settings.profilePhotoUrl);
            setLogoUrl(settings.logoUrl);
            setAppNameState(settings.appName || '');
            setUseLogoAsIcon(!!settings.useLogoAsIcon);
            if (settings.appName) setAppName(settings.appName);
            if (settings.useLogoAsIcon && settings.logoUrl) setFavicon(settings.logoUrl);
          }
        })
        .catch((err) => console.error(err));
    }
  }, []);

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
  const handleProfileFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) {
      toast({ title: 'Faça login', description: 'Necessário estar logado', variant: 'destructive' });
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingProfile(true);
      const url = await UserSettingsService.uploadProfilePhoto(userId, file);
      await UserSettingsService.update(userId, { profilePhotoUrl: url });
      setProfilePhotoUrl(url);
      toast({ title: 'Foto atualizada', description: 'Sua foto de perfil foi salva' });
    } catch (error) {
      toast({ title: 'Erro ao enviar', description: error instanceof Error ? error.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setIsUploadingProfile(false);
      if (fileInputProfileRef.current) fileInputProfileRef.current.value = '';
    }
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) {
      toast({ title: 'Faça login', description: 'Necessário estar logado', variant: 'destructive' });
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingLogo(true);
      const url = await UserSettingsService.uploadLogo(userId, file);
      await UserSettingsService.update(userId, { logoUrl: url });
      setLogoUrl(url);
      if (useLogoAsIcon) setFavicon(url);
      toast({ title: 'Logo atualizada', description: 'A identidade visual foi salva' });
    } catch (error) {
      toast({ title: 'Erro ao enviar', description: error instanceof Error ? error.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setIsUploadingLogo(false);
      if (fileInputLogoRef.current) fileInputLogoRef.current.value = '';
    }
  };

  const handleToggleUseAsIcon = async (checked: boolean) => {
    setUseLogoAsIcon(checked);
    if (userId) {
      await UserSettingsService.update(userId, { useLogoAsIcon: checked });
    }
    if (checked && logoUrl) setFavicon(logoUrl);
  };

  const handleSaveAppName = async () => {
    if (!userId) {
      toast({ title: 'Faça login', description: 'Necessário estar logado', variant: 'destructive' });
      return;
    }
    try {
      setIsSavingName(true);
      await UserSettingsService.update(userId, { appName });
      setAppName(appName);
      toast({ title: 'Nome atualizado', description: 'O nome do app foi alterado' });
    } catch (error) {
      toast({ title: 'Erro ao salvar', description: error instanceof Error ? error.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setIsSavingName(false);
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

        {/* Perfil */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Camera className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Perfil</h2>
          </div>
          <Card className="p-4 shadow-ios-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={profilePhotoUrl} alt="Foto de perfil do usuário" />
                  <AvatarFallback>PF</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">Foto do perfil</p>
                  <p className="text-sm text-muted-foreground">Aparece para outros usuários</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input ref={fileInputProfileRef} id="profile-photo-input" type="file" accept="image/*" className="hidden" onChange={handleProfileFileChange} />
                <Label htmlFor="profile-photo-input" className="sr-only">Selecionar foto de perfil</Label>
                <Button variant="outline" size="sm" onClick={() => fileInputProfileRef.current?.click()} disabled={isUploadingProfile}>
                  {isUploadingProfile ? 'Enviando...' : 'Alterar'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Identidade do App */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Image className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Identidade do App</h2>
          </div>
          <Card className="p-4 shadow-ios-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {logoUrl ? <img src={logoUrl} alt="Logo do consultor ou fazenda" className="h-full w-full object-cover" /> : <span className="text-sm text-muted-foreground">Sem logo</span>}
                </div>
                <div>
                  <p className="font-medium text-foreground">Logo do consultor ou fazenda</p>
                  <p className="text-sm text-muted-foreground">Pode ser usado como ícone do app</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input ref={fileInputLogoRef} id="logo-input" type="file" accept="image/*" className="hidden" onChange={handleLogoFileChange} />
                <Label htmlFor="logo-input" className="sr-only">Selecionar logo</Label>
                <Button variant="outline" size="sm" onClick={() => fileInputLogoRef.current?.click()} disabled={isUploadingLogo}>
                  {isUploadingLogo ? 'Enviando...' : 'Alterar logo'}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Usar logo como ícone do app</p>
                <p className="text-sm text-muted-foreground">Atualiza o ícone mostrado no navegador</p>
              </div>
              <Switch checked={useLogoAsIcon} onCheckedChange={handleToggleUseAsIcon} disabled={!logoUrl} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-name">Nome do aplicativo</Label>
              <div className="flex items-center gap-2">
                <Input id="app-name" placeholder="Digite o nome do app" value={appName} onChange={(e) => setAppNameState(e.target.value)} />
                <Button onClick={handleSaveAppName} disabled={isSavingName || !appName} variant="default">
                  {isSavingName ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Nota: alterar o ícone do app em versões nativas requer uma nova build. Aqui o ícone do navegador é atualizado.</p>
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