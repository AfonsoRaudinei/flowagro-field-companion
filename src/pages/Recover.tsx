import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
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

const isValidEmail = (v: string) => /.+@.+\..+/.test(v);

const Recover: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Recuperar senha – FlowAgro";
  }, []);

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  // countdown for resend
  useEffect(() => {
    if (!sent) return;
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [sent, cooldown]);

  const canSubmit = useMemo(() => isValidEmail(email) && !loading, [email, loading]);

  const handleSend = async () => {
    setError(null);
    if (!isValidEmail(email)) {
      setError("Informe um e-mail válido.");
      return;
    }
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      if (error) throw error;
      setSent(true);
      setCooldown(60);
    } catch (e: any) {
      setError(e.message || "E‑mail não encontrado.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    await handleSend();
  };

  const openMailApp = () => {
    window.location.href = `mailto:${email}`;
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
          <h1 className="text-xl font-semibold text-center mt-2">Recuperar senha</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">Informe seu e‑mail para receber o link de redefinição.</p>

          <Card className="p-5 shadow-ios-md mt-5">
            {!sent ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Campo E‑mail</Label>
                  <Input
                    inputMode="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base"
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <Button className="w-full h-12 text-base font-semibold" onClick={handleSend} disabled={!canSubmit}>
                  <Mail className="h-5 w-5 mr-2" /> Botão Enviar link de recuperação
                </Button>
              </div>
            ) : (
              <div className="space-y-5 text-center">
                <div className="flex justify-center mt-1">
                  <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
                </div>
                <p className="text-sm">Enviamos um link para seu e‑mail. Verifique sua caixa de entrada e spam.</p>
                <Button variant="secondary" className="w-full h-11" onClick={openMailApp}>
                  Botão Abrir app de e‑mail
                </Button>
                <div className="text-sm flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0}
                    className="underline disabled:no-underline disabled:opacity-50"
                  >
                    {cooldown > 0 ? `Link Reenviar em ${cooldown}s` : "Reenviar"}
                  </button>
                  <Link to="/login-form" className="underline">Link Voltar ao Login</Link>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Recover;
