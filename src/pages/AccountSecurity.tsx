import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Lock, X, AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";

const PASSWORD_MIN = 8;

function getBrowserOs(): string {
  const ua = navigator.userAgent;
  const isWindows = /Windows NT/i.test(ua);
  const isMac = /Mac OS X/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  const os = isWindows ? "Windows" : isMac ? "macOS" : isIOS ? "iOS" : isAndroid ? "Android" : "Desconhecido";

  const browser = /Chrome\//i.test(ua)
    ? "Chrome"
    : /Safari\//i.test(ua) && !/Chrome\//i.test(ua)
    ? "Safari"
    : /Firefox\//i.test(ua)
    ? "Firefox"
    : /Edg\//i.test(ua)
    ? "Edge"
    : "Navegador";

  return `${browser} – ${os}`;
}

function passwordStrength(pw: string): "Fraca" | "Média" | "Forte" {
  let score = 0;
  if (pw.length >= PASSWORD_MIN) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score >= 4) return "Forte";
  if (score >= 2) return "Média";
  return "Fraca";
}

const AccountSecurity: React.FC = () => {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [currentError, setCurrentError] = useState<string | null>(null);
  const [newError, setNewError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [footerError, setFooterError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

const [sessionLoginAt, setSessionLoginAt] = useState<string | null>(null);
  const [sessionDevice, setSessionDevice] = useState<string>(getBrowserOs());
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    document.title = "Conta & Segurança | FlowAgro";
  }, []);

  useEffect(() => {
    // Initialize session started at from localStorage if not present
    const key = "session_started_at";
    const stored = localStorage.getItem(key);
    if (stored) {
      setSessionLoginAt(stored);
    } else {
      const now = new Date().toISOString();
      localStorage.setItem(key, now);
      setSessionLoginAt(now);
    }
}, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  const strength = useMemo(() => passwordStrength(newPassword), [newPassword]);

  const validate = (): boolean => {
    let ok = true;
    setCurrentError(null);
    setNewError(null);
    setConfirmError(null);
    setFooterError(null);
    setSuccessMsg(null);

    if (!currentPassword) {
      setCurrentError("Informe sua senha atual");
      ok = false;
    }

    if (!newPassword) {
      setNewError("Informe a nova senha");
      ok = false;
    } else if (newPassword.length < PASSWORD_MIN) {
      setNewError(`Mínimo de ${PASSWORD_MIN} caracteres`);
      ok = false;
    }

    if (!confirmPassword) {
      setConfirmError("Confirme a nova senha");
      ok = false;
    } else if (confirmPassword !== newPassword) {
      setConfirmError("As senhas não coincidem");
      ok = false;
    }

    return ok;
  };

  const canSave = useMemo(() => {
    // Disabled while invalid or saving
    if (saving) return false;
    // Quick client validations
    if (!currentPassword || !newPassword || !confirmPassword) return false;
    if (newPassword.length < PASSWORD_MIN) return false;
    if (confirmPassword !== newPassword) return false;
    return true;
  }, [currentPassword, newPassword, confirmPassword, saving]);

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      setFooterError(null);
      setSuccessMsg(null);

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user || !userData.user.email) {
        setFooterError("Não foi possível carregar seu usuário. Faça login novamente.");
        setSaving(false);
        return;
      }

      // Reauthenticate
      const { error: reauthErr } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: currentPassword,
      });

      if (reauthErr) {
        // Map common auth error to inline message
        setCurrentError("Senha atual incorreta");
        setSaving(false);
        return;
      }

      // Update password
      const { error: updErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updErr) {
        setFooterError("Falha ao alterar a senha. Tente novamente.");
        setSaving(false);
        return;
      }

      // Success
      setSuccessMsg("Senha alterada com sucesso");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // A11y: move focus back to title
      setTimeout(() => titleRef.current?.focus(), 0);
    } catch (e) {
      setFooterError("Erro inesperado. Verifique sua conexão.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOutLocal = async () => {
    try {
      setFooterError(null);
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        setFooterError("Falha ao encerrar a sessão deste dispositivo.");
        return;
      }
      navigate("/login-form");
    } catch (e) {
      setFooterError("Erro inesperado ao encerrar a sessão local.");
    }
  };

  const handleSignOutAll = async () => {
    try {
      setFooterError(null);
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) {
        setFooterError("Falha ao encerrar sessões.");
        return;
      }
      navigate("/login-form");
    } catch (e) {
      setFooterError("Erro inesperado ao encerrar sessões.");
    }
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="px-4 py-3 space-y-4">
<header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Voltar" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </Button>
        <div className="flex flex-col">
          <h1
            ref={titleRef}
            tabIndex={-1}
            className="text-lg font-semibold"
            aria-label="Conta e Segurança"
          >
            Conta & Segurança
          </h1>
          {userEmail && (
            <p className="text-sm text-muted-foreground" aria-label="E-mail do usuário">
              {userEmail}
            </p>
          )}
        </div>
      </header>

      <main className="space-y-6">
        <section aria-labelledby="password-section">
          <Card>
            <CardHeader>
              <CardTitle id="password-section">Alterar senha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Campo Senha atual</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    aria-invalid={!!currentError}
                    aria-describedby={currentError ? "current-password-error" : undefined}
                  />
                  <button
                    type="button"
                    aria-label={showCurrent ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                    onClick={() => setShowCurrent((s) => !s)}
                  >
                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {currentError && (
                  <p id="current-password-error" className="text-sm text-destructive">
                    {currentError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Campo Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  aria-invalid={!!newError}
                  aria-describedby="password-help"
                />
                <div className="flex items-center justify-between">
                  <p id="password-help" className="text-xs text-muted-foreground">
                    Sua senha deve ter pelo menos 8 caracteres.
                  </p>
                  <p className="text-xs text-muted-foreground" aria-live="polite">
                    Força: {strength}
                  </p>
                </div>
                {newError && <p className="text-sm text-destructive">{newError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Campo Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    aria-invalid={!!confirmError}
                    aria-describedby={confirmError ? "confirm-password-error" : undefined}
                  />
                  <button
                    type="button"
                    aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                    onClick={() => setShowConfirm((s) => !s)}
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {confirmError && (
                  <p id="confirm-password-error" className="text-sm text-destructive">
                    {confirmError}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-2">
<Button onClick={handleSave} disabled={!canSave} aria-label="Botão Salvar nova senha">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2" /> Botão Salvar nova senha
                  </>
                )}
              </Button>
              {footerError && <p className="text-sm text-destructive">{footerError}</p>}
              {successMsg && <p className="text-sm text-muted-foreground">{successMsg}</p>}
            </CardFooter>
          </Card>
        </section>

        <section aria-labelledby="sessions-section">
          <Card>
            <CardHeader>
              <CardTitle id="sessions-section">Lista de Sessões Ativas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Este dispositivo — {sessionDevice}</p>
                  <p className="text-xs text-muted-foreground">
                    Login em {formatDateTime(sessionLoginAt)} — Sessão atual
                  </p>
                </div>
<Button size="sm" variant="secondary" disabled aria-label="Encerrar sessão atual desabilitado">
                  <X className="mr-1" /> Disponível em breve
                </Button>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Encerrar sessões remove o acesso em outros dispositivos.
              </p>
            </CardContent>
<CardFooter className="flex gap-2">
              <Button variant="secondary" onClick={handleSignOutLocal} aria-label="Sair deste dispositivo">
                Sair deste dispositivo
              </Button>
              <Button variant="outline" onClick={handleSignOutAll} aria-label="Botão Encerrar todas as sessões">
                <AlertTriangle className="mr-2" /> Botão Encerrar todas as sessões
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section aria-labelledby="account-actions">
          <Card>
            <CardHeader>
              <CardTitle id="account-actions">Ações de conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="link" className="justify-start px-0" aria-label="Botão Desativar conta">
                Botão Desativar conta
              </Button>
              <p className="text-xs text-muted-foreground">
                Entre em contato com o suporte para reativar.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default AccountSecurity;
