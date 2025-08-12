import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, LockOpen, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const FlowAgroLogo = () => (
  <img
    src="/lovable-uploads/8b99d25a-b36a-446f-830c-1a25c42c87c3.png"
    alt="FlowAgro logo"
    className="w-9 h-9 object-contain"
  />
);

const passwordStrength = (pwd: string) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  return score; // 0-5
};

function parseHashTokens(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  const type = params.get("type");
  return { access_token, refresh_token, type };
}

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Definir nova senha – FlowAgro";
  }, []);

  // Ensure session from email link
  useEffect(() => {
    const { access_token, refresh_token } = parseHashTokens(window.location.hash);
    if (access_token && refresh_token) {
      // Set session so updateUser works
      supabase.auth.setSession({ access_token, refresh_token }).catch(() => {});
    }
  }, []);

  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const strength = passwordStrength(pwd);
  const strengthLabel = strength <= 1 ? "Fraca" : strength <= 3 ? "Média" : "Forte";

  const canSave = useMemo(() => {
    return pwd.length >= 8 && pwd === pwd2 && !saving;
  }, [pwd, pwd2, saving]);

  const handleSave = async () => {
    setError(null);
    if (pwd.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (pwd !== pwd2) {
      setError("As senhas não coincidem.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Não foi possível redefinir a senha.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
          <button aria-label="Voltar" onClick={() => navigate("/login-form")} className="p-2 rounded-md hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 flex justify-center"><FlowAgroLogo /></div>
          <div className="w-9" />
        </div>
      </header>

      <main className="flex-1 px-4 pb-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-semibold text-center mt-2">Definir nova senha</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">Crie uma nova senha para acessar sua conta.</p>

          <Card className="p-5 shadow-ios-md mt-5">
            {!done ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Campo Nova Senha</Label>
                  <div className="relative">
                    <Input
                      type={show1 ? "text" : "password"}
                      value={pwd}
                      onChange={(e) => setPwd(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 pr-12 text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShow1((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-secondary"
                      aria-label={show1 ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {show1 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Força: {strengthLabel}</p>
                </div>

                <div className="space-y-2">
                  <Label>Campo Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      type={show2 ? "text" : "password"}
                      value={pwd2}
                      onChange={(e) => setPwd2(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 pr-12 text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShow2((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-secondary"
                      aria-label={show2 ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {show2 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button className="w-full h-12 text-base font-semibold" disabled={!canSave} onClick={handleSave}>
                  <LockOpen className="h-5 w-5 mr-2" /> Botão Salvar nova senha
                </Button>
              </div>
            ) : (
              <div className="space-y-5 text-center">
                <div className="flex justify-center mt-1">
                  <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
                </div>
                <p className="text-sm">Senha alterada com sucesso!</p>
                <Button className="w-full h-12 text-base font-semibold" onClick={() => navigate("/login-form")}>Botão Ir para o Login</Button>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
