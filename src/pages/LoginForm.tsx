import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Lock, ArrowRight, Eye, EyeOff, User, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

const FlowAgroLogo = () => (
  <img
    src="/lovable-uploads/8b99d25a-b36a-446f-830c-1a25c42c87c3.png"
    alt="FlowAgro logo"
    className="w-9 h-9 object-contain"
  />
);

const maskCep = (v: string) => {
  const n = v.replace(/\D/g, '').slice(0, 8);
  if (n.length <= 5) return n;
  return `${n.slice(0, 5)}-${n.slice(5)}`;
};

const isValidEmail = (v: string) => /.+@.+\..+/.test(v);

const passwordStrength = (pwd: string) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[a-zA-Z]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  return score; // 0-4
};

const LoginForm: React.FC = () => {
  const navigate = useNavigate();

  // Header SEO
  useEffect(() => {
    document.title = 'Login FlowAgro – Autenticação';
  }, []);

  // Shared state
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Login state
  const [loginEmailOrCpf, setLoginEmailOrCpf] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRemember, setLoginRemember] = useState(true);
  const [loginShowPwd, setLoginShowPwd] = useState(false);
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string; submit?: string }>({});
  const isLoginValid = useMemo(() => {
    return isValidEmail(loginEmailOrCpf) && loginPassword.length > 0;
  }, [loginEmailOrCpf, loginPassword]);

  // Signup state
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPwd, setSignupPwd] = useState('');
  const [signupPwdConfirm, setSignupPwdConfirm] = useState('');
  const [userProfile, setUserProfile] = useState('');
  const [cep, setCep] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [useLogoAsIcon, setUseLogoAsIcon] = useState(false);
  const [signupShowPwd, setSignupShowPwd] = useState(false);
  const [signupShowPwd2, setSignupShowPwd2] = useState(false);
  const [signupErrors, setSignupErrors] = useState<{ fullName?: string; email?: string; password?: string; confirm?: string; userProfile?: string; submit?: string }>({});

  const avatarPreview = useMemo(() => (avatarFile ? URL.createObjectURL(avatarFile) : ''), [avatarFile]);
  const logoPreview = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : ''), [logoFile]);

  useEffect(() => () => {
    // Revoke object URLs on unmount
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
  }, [avatarPreview, logoPreview]);

  const uploadingRef = useRef(false);

  const handleLogin = async () => {
    const errors: typeof loginErrors = {};
    if (!isValidEmail(loginEmailOrCpf)) errors.email = 'Informe um e-mail válido.';
    if (!loginPassword) errors.password = 'Informe sua senha.';
    setLoginErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmailOrCpf,
        password: loginPassword,
      });
      if (error) throw error;

      // Persistência da sessão (o client já está com persistSession=true)
      localStorage.setItem('flowagro_remember_me', loginRemember ? '1' : '0');

      // Confirmar leitura de perfil e app_settings
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      if (uid) {
        await supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle();
        await supabase.from('app_settings').select('*').eq('user_id', uid).maybeSingle();
      }

      navigate('/dashboard');
    } catch (e: any) {
      setLoginErrors((prev) => ({ ...prev, submit: e.message || 'Falha ao autenticar.' }));
    }
  };

  const uploadIfAny = async (uid: string) => {
    const urls: { avatar_url?: string; logo_url?: string } = {};

    // Avatar upload
    if (avatarFile && !uploadingRef.current) {
      uploadingRef.current = true;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(`${uid}/avatar`, avatarFile, { upsert: true });
      uploadingRef.current = false;
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('avatars').getPublicUrl(`${uid}/avatar`);
      urls.avatar_url = data.publicUrl;
    }

    // Logo upload
    if (logoFile && !uploadingRef.current) {
      uploadingRef.current = true;
      const { error: upErr } = await supabase.storage
        .from('logos')
        .upload(`${uid}/logo`, logoFile, { upsert: true });
      uploadingRef.current = false;
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('logos').getPublicUrl(`${uid}/logo`);
      urls.logo_url = data.publicUrl;
    }

    return urls;
  };

  const handleSignup = async () => {
    const errors: typeof signupErrors = {};
    if (!fullName) errors.fullName = 'Informe seu nome completo.';
    if (!isValidEmail(signupEmail)) errors.email = 'Informe um e-mail válido.';
    if (!signupPwd) errors.password = 'Informe uma senha.';
    if (signupPwd !== signupPwdConfirm) errors.confirm = 'As senhas não coincidem.';
    if (!userProfile) errors.userProfile = 'Selecione um perfil.';
    setSignupErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPwd,
        options: { emailRedirectTo: redirectUrl },
      });
      if (signUpError) throw signUpError;

      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      if (!uid) {
        setSignupErrors((prev) => ({ ...prev, submit: 'Conta criada. Verifique seu e-mail para confirmar o acesso.' }));
        return;
      }

      const uploaded = await uploadIfAny(uid);

      // Upsert profile
      const { error: profileErr } = await supabase.from('profiles').upsert({
        user_id: uid,
        full_name: fullName,
        user_profile: userProfile,
        cep,
        avatar_url: uploaded.avatar_url,
        logo_url: uploaded.logo_url,
        use_logo_as_app_icon: useLogoAsIcon,
      }, { onConflict: 'user_id' });
      if (profileErr) throw profileErr;

      // Lembrar acesso
      localStorage.setItem('flowagro_remember_me', '1');

      // Confirmar leitura
      await supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle();
      await supabase.from('app_settings').select('*').eq('user_id', uid).maybeSingle();

      navigate('/dashboard');
    } catch (e: any) {
      setSignupErrors((prev) => ({ ...prev, submit: e.message || 'Falha ao criar conta.' }));
    }
  };

  const pwdScore = passwordStrength(signupPwd);
  const pwdLabel = ['Muito fraca', 'Fraca', 'Média', 'Forte', 'Excelente'][pwdScore] || 'Muito fraca';

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
        <h1 className="sr-only">Autenticação FlowAgro: Login e Cadastro</h1>
        <div className="max-w-md mx-auto">
          {/* Segmented Control */}
          <div className="flex justify-center mt-1 mb-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              <TabsList className="rounded-full bg-secondary px-1 py-1 h-10">
                <TabsTrigger value="login" className="rounded-full px-5 data-[state=active]:shadow-ios-sm">Login</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-full px-5 data-[state=active]:shadow-ios-sm">Cadastrar-se</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <Card className="p-5 shadow-ios-md">
            {/* Login */}
            {activeTab === 'login' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Campo E-mail ou CPF</Label>
                  <Input
                    inputMode="email"
                    placeholder="seu@email.com"
                    value={loginEmailOrCpf}
                    onChange={(e) => setLoginEmailOrCpf(e.target.value)}
                    className="h-12 text-base"
                  />
                  {loginErrors.email && <p className="text-sm text-destructive">{loginErrors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Campo Senha</Label>
                  <div className="relative">
                    <Input
                      type={loginShowPwd ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="h-12 pr-12 text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setLoginShowPwd((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-secondary"
                      aria-label={loginShowPwd ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {loginShowPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {loginErrors.password && <p className="text-sm text-destructive">{loginErrors.password}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" checked={loginRemember} onCheckedChange={(v) => setLoginRemember(!!v)} />
                    <Label htmlFor="remember" className="text-sm">Lembrar acesso neste dispositivo</Label>
                  </div>
                  <Link to="/recover" className="text-sm underline">Esqueci a senha</Link>
                </div>

                {loginErrors.submit && <p className="text-sm text-destructive">{loginErrors.submit}</p>}

                <Button className="w-full h-12 text-base font-semibold" disabled={!isLoginValid} onClick={handleLogin}>
                  <Lock className="h-5 w-5 mr-2" /> Botão Acessar FlowAgro
                </Button>
              </div>
            )}

            {/* Signup */}
            {activeTab === 'signup' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 text-base"
                  />
                  {signupErrors.fullName && <p className="text-sm text-destructive">{signupErrors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    inputMode="email"
                    placeholder="seu@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="h-12 text-base"
                  />
                  {signupErrors.email && <p className="text-sm text-destructive">{signupErrors.email}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <div className="relative">
                      <Input
                        type={signupShowPwd ? 'text' : 'password'}
                        value={signupPwd}
                        onChange={(e) => setSignupPwd(e.target.value)}
                        placeholder="••••••••"
                        className="h-12 pr-12 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setSignupShowPwd((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-secondary"
                        aria-label={signupShowPwd ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {signupShowPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Força: {pwdLabel}</p>
                    {signupErrors.password && <p className="text-sm text-destructive">{signupErrors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Confirmar senha</Label>
                    <div className="relative">
                      <Input
                        type={signupShowPwd2 ? 'text' : 'password'}
                        value={signupPwdConfirm}
                        onChange={(e) => setSignupPwdConfirm(e.target.value)}
                        placeholder="••••••••"
                        className="h-12 pr-12 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setSignupShowPwd2((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-secondary"
                        aria-label={signupShowPwd2 ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {signupShowPwd2 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {signupErrors.confirm && <p className="text-sm text-destructive">{signupErrors.confirm}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dropdown Perfil do usuário</Label>
                  <Select value={userProfile} onValueChange={(v) => setUserProfile(v)}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-popover">
                      <SelectItem value="Produtor">Produtor</SelectItem>
                      <SelectItem value="Consultor">Consultor</SelectItem>
                      <SelectItem value="Gestor">Gestor</SelectItem>
                    </SelectContent>
                  </Select>
                  {signupErrors.userProfile && <p className="text-sm text-destructive">{signupErrors.userProfile}</p>}
                </div>

                <div className="space-y-2">
                  <Label>CEP (opcional)</Label>
                  <Input
                    inputMode="numeric"
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => setCep(maskCep(e.target.value))}
                    maxLength={9}
                    className="h-12 text-base"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Upload Foto de Perfil</Label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer hover:bg-secondary">
                        <ImageIcon className="h-4 w-4" /> Selecionar
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
                      </label>
                      {avatarPreview && <img src={avatarPreview} alt="Preview avatar" className="w-10 h-10 rounded-full object-cover border" />}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Logo do Consultor</Label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer hover:bg-secondary">
                        <ImageIcon className="h-4 w-4" /> Selecionar
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                      </label>
                      {logoPreview && <img src={logoPreview} alt="Preview logo" className="w-10 h-10 rounded-md object-cover border" />}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="toggle-icon" checked={useLogoAsIcon} onCheckedChange={(v) => setUseLogoAsIcon(!!v)} />
                  <Label htmlFor="toggle-icon" className="text-sm">Toggle Usar logo como ícone do app</Label>
                </div>

                {signupErrors.submit && <p className="text-sm text-destructive">{signupErrors.submit}</p>}

                <Button className="w-full h-12 text-base font-semibold" disabled={!fullName || !isValidEmail(signupEmail) || !signupPwd || signupPwd !== signupPwdConfirm || !userProfile} onClick={handleSignup}>
                  <ArrowRight className="h-5 w-5 mr-2" /> Botão Criar conta
                </Button>
              </div>
            )}
          </Card>

          <p className="text-xs text-muted-foreground text-center mt-3">Sem modais. Campos obrigatórios desabilitam os botões até preenchimento válido.</p>
        </div>
      </main>
    </div>
  );
};

export default LoginForm;