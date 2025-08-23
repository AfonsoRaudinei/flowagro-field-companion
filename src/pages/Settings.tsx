import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import IOSNavigation from '@/components/ui/ios-navigation';
import { ArrowLeft, Image as ImageIcon, RefreshCw, Moon, Sun, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { setFavicon } from '@/lib/branding';

const FlowAgroLogo = () => (
  <img
    src="/lovable-uploads/8b99d25a-b36a-446f-830c-1a25c42c87c3.png"
    alt="FlowAgro logo"
    className="w-9 h-9 object-contain"
  />
);

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const fileInputLogoRef = useRef<HTMLInputElement>(null);
  const fileInputAvatarRef = useRef<HTMLInputElement>(null);

  const [uid, setUid] = useState<string | null>(null);

  // Data
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [useLogoAsIcon, setUseLogoAsIcon] = useState<boolean>(false);
  const [appName, setAppName] = useState<string>('FlowAgro');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Toast for notifications
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingLogo, setSavingLogo] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const id = sessionData.session?.user?.id || null;
      setUid(id);
      if (!id) return;

      const [{ data: app }, { data: prof }] = await Promise.all([
        supabase.from('app_settings').select('*').eq('user_id', id).maybeSingle(),
        supabase.from('profiles').select('*').eq('user_id', id).maybeSingle(),
      ]);

      setLogoUrl(app?.logo_url ?? prof?.logo_url ?? null);
      setUseLogoAsIcon(Boolean(app?.use_logo_as_app_icon ?? prof?.use_logo_as_app_icon ?? false));
      setAppName(app?.app_name ?? 'FlowAgro');
      setAvatarUrl(prof?.avatar_url ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Configurações – FlowAgro';
    loadData();
    // Initialize dark mode from system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(document.documentElement.classList.contains('dark') || prefersDark);
  }, []);

  const handleChangeLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!uid) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Formato inválido",
        description: "Apenas arquivos de imagem são permitidos.",
        variant: "destructive"
      });
      return;
    }

    setSavingLogo(true);
    try {
      const path = `${uid}/logo`;
      const { error: upErr } = await supabase.storage.from('logos').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('logos').getPublicUrl(path);
      const publicUrl = data.publicUrl;
      // Upsert profiles.logo_url
      const { error: profErr } = await supabase.from('profiles').upsert({ user_id: uid, logo_url: publicUrl }, { onConflict: 'user_id' });
      if (profErr) throw profErr;
      setLogoUrl(publicUrl);
      toast({
        title: "Sucesso!",
        description: "Logo atualizada com sucesso."
      });
      if (useLogoAsIcon) setFavicon(publicUrl);
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || 'Erro ao enviar logo.',
        variant: "destructive"
      });
    } finally {
      setSavingLogo(false);
      if (fileInputLogoRef.current) fileInputLogoRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!uid) return;
    setSavingLogo(true);
    try {
      const path = `${uid}/logo`;
      await supabase.storage.from('logos').remove([path]);
      // set profiles.logo_url = null
      await supabase.from('profiles').upsert({ user_id: uid, logo_url: null }, { onConflict: 'user_id' });
      setLogoUrl(null);
      toast({
        title: "Logo removida",
        description: "Logo removida com sucesso."
      });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || 'Erro ao remover logo.',
        variant: "destructive"
      });
    } finally {
      setSavingLogo(false);
    }
  };

  const handleToggleIcon = async (checked: boolean) => {
    if (!uid) return;
    setSavingToggle(true);
    try {
      setUseLogoAsIcon(checked);
      await supabase.from('profiles').upsert({ user_id: uid, use_logo_as_app_icon: checked }, { onConflict: 'user_id' });
      if (checked) {
        if (logoUrl) {
          setFavicon(logoUrl);
          toast({
            title: "Ícone atualizado",
            description: "Logo definida como ícone do app."
          });
        } else {
          toast({
            title: "Atenção",
            description: "Adicione um logo para usar como ícone.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Ícone padrão",
          description: "Usando ícone padrão do app."
        });
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || 'Erro ao salvar preferência.',
        variant: "destructive"
      });
    } finally {
      setSavingToggle(false);
    }
  };

  const handleSaveAppName = async () => {
    if (!uid) return;
    setSavingName(true);
    try {
      await supabase.from('app_settings').upsert({ user_id: uid, app_name: appName }, { onConflict: 'user_id' });
      toast({
        title: "Nome salvo",
        description: "Nome do aplicativo atualizado."
      });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || 'Erro ao salvar.',
        variant: "destructive"
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangeAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!uid) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Formato inválido",
        description: "Apenas arquivos de imagem são permitidos.",
        variant: "destructive"
      });
      return;
    }

    setSavingAvatar(true);
    try {
      const path = `${uid}/avatar`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = data.publicUrl;
      await supabase.from('profiles').upsert({ user_id: uid, avatar_url: publicUrl }, { onConflict: 'user_id' });
      setAvatarUrl(publicUrl);
      toast({
        title: "Avatar atualizado",
        description: "Foto de perfil atualizada com sucesso."
      });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || 'Erro ao enviar foto.',
        variant: "destructive"
      });
    } finally {
      setSavingAvatar(false);
      if (fileInputAvatarRef.current) fileInputAvatarRef.current.value = '';
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await loadData();
      if (useLogoAsIcon && logoUrl) setFavicon(logoUrl);
      toast({
        title: "Sincronização completa",
        description: "Todos os dados foram atualizados."
      });
    } catch (err) {
      toast({
        title: "Erro na sincronização",
        description: "Erro ao sincronizar dados.",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    toast({
      title: newMode ? "Modo escuro ativado" : "Modo claro ativado",
      description: `Interface alterada para tema ${newMode ? 'escuro' : 'claro'}.`
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-ios-tab-bar">
      {/* Header */}
      <header className="sticky top-0 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
          <button aria-label="Voltar" onClick={() => navigate(-1)} className="p-2 rounded-md hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 flex justify-center"><FlowAgroLogo /></div>
          <div className="w-9" />
        </div>
      </header>

      <main className="flex-1 px-4 pb-8">
        <div className="max-w-md mx-auto space-y-6">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <Card className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-14 w-14 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-9 w-full" />
              </Card>
              <Card className="p-5">
                <Skeleton className="h-16 w-full" />
              </Card>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold mt-2">Configurações</h1>

          {/* Identidade do App */}
          <section aria-labelledby="identity-title">
            <h2 id="identity-title" className="sr-only">Identidade do App</h2>
            <Card className="p-5 shadow-ios-md space-y-5">
              {/* Logo atual */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo do consultor ou fazenda" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm text-muted-foreground">Sem logo</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Logo do consultor ou fazenda</p>
                    <p className="text-xs text-muted-foreground">Logo do consultor ou fazenda</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input ref={fileInputLogoRef} id="logo-input" type="file" accept="image/*" className="hidden" onChange={handleChangeLogo} />
                  <Label htmlFor="logo-input" className="sr-only">Selecionar logo</Label>
                  <Button variant="outline" size="sm" onClick={() => fileInputLogoRef.current?.click()} disabled={savingLogo}>
                    {savingLogo ? 'Enviando...' : 'Alterar logo'}
                  </Button>
                  {logoUrl && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={savingLogo}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover logo</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover o logo? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleRemoveLogo} className="bg-destructive text-destructive-foreground">
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              {/* Toggle usar como ícone */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Usar logo como ícone do app (navegador)</p>
                  <p className="text-xs text-muted-foreground">Atualiza o ícone mostrado no navegador</p>
                </div>
                <Switch checked={useLogoAsIcon} onCheckedChange={(v) => handleToggleIcon(!!v)} disabled={savingToggle} />
              </div>

              {/* Nome do aplicativo */}
              <div className="space-y-2">
                <Label htmlFor="app-name">Nome do aplicativo</Label>
                <div className="flex items-center gap-2">
                  <Input id="app-name" placeholder="FlowAgro" value={appName} onChange={(e) => setAppName(e.target.value)} />
                  <Button onClick={handleSaveAppName} disabled={savingName || !appName}>
                    {savingName ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">Altera o ícone apenas no navegador. Versões nativas requerem nova build.</p>
            </Card>
          </section>

          {/* Sincronização */}
          <section aria-labelledby="sync-title">
            <h2 id="sync-title" className="sr-only">Sincronização</h2>
            <Card className="p-5 shadow-ios-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <RefreshCw className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Forçar sincronização</p>
                    <p className="text-xs text-muted-foreground">Sincronizar todos os dados de identidade agora</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Sincronizando...' : 'Botão Sincronizar'}
                </Button>
              </div>
            </Card>
          </section>

          {/* Tema */}
          <section aria-labelledby="theme-title">
            <h2 id="theme-title" className="sr-only">Tema</h2>
            <Card className="p-5 shadow-ios-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {isDarkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <p className="font-medium">Modo escuro</p>
                    <p className="text-xs text-muted-foreground">Alternar entre tema claro e escuro</p>
                  </div>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={handleToggleDarkMode} />
              </div>
            </Card>
          </section>

          {/* Perfil (opcional, compacto) */}
          <section aria-labelledby="profile-title">
            <h2 id="profile-title" className="sr-only">Perfil</h2>
            <Card className="p-5 shadow-ios-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={avatarUrl ?? undefined} alt="Foto de perfil" />
                    <AvatarFallback>PF</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Foto de perfil</p>
                    <p className="text-xs text-muted-foreground">Aparece para outros usuários</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input ref={fileInputAvatarRef} id="avatar-input" type="file" accept="image/*" className="hidden" onChange={handleChangeAvatar} />
                  <Label htmlFor="avatar-input" className="sr-only">Selecionar foto</Label>
                  <Button variant="outline" size="sm" onClick={() => fileInputAvatarRef.current?.click()} disabled={savingAvatar}>
                    {savingAvatar ? 'Enviando...' : 'Trocar foto'}
                  </Button>
                </div>
              </div>
            </Card>
            </section>
            </>
          )}
        </div>
      </main>

      {/* iOS Navigation */}
      <IOSNavigation />
    </div>
  );
};

export default Settings;
