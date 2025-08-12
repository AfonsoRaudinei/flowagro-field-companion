import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const FlowAgroLogo = () => (
  <img
    src="/lovable-uploads/8b99d25a-b36a-446f-830c-1a25c42c87c3.png"
    alt="FlowAgro logo"
    className="w-9 h-9 object-contain"
  />
);

const maskCep = (v: string) => {
  const n = v.replace(/\D/g, "").slice(0, 8);
  if (n.length <= 5) return n;
  return `${n.slice(0, 5)}-${n.slice(5)}`;
};

const allowedProfiles = ["Produtor", "Consultor", "Gestor"] as const;

type FormErrors = {
  full_name?: string;
  user_profile?: string;
  cep?: string;
  submit?: string;
};

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  user_profile: string | null;
  cep: string | null;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Perfil do Usuário – FlowAgro";
  }, []);

  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [fullName, setFullName] = useState("");
  const [userProfile, setUserProfile] = useState("");
  const [cep, setCep] = useState("");

  const [initial, setInitial] = useState<{
    full_name: string;
    user_profile: string;
    cep: string;
  } | null>(null);

  const hasChanges = useMemo(() => {
    if (!initial) return false;
    return (
      fullName !== (initial.full_name || "") ||
      userProfile !== (initial.user_profile || "") ||
      cep !== (initial.cep || "")
    );
  }, [fullName, userProfile, cep, initial]);

  const isValid = useMemo(() => {
    const newErrors: FormErrors = {};
    if (!fullName || fullName.trim().length < 3) newErrors.full_name = "Informe ao menos 3 caracteres.";
    if (!userProfile || !allowedProfiles.includes(userProfile as any)) newErrors.user_profile = "Selecione um perfil válido.";
    if (cep && cep.replace(/\D/g, "").length !== 8) newErrors.cep = "CEP deve conter 8 dígitos.";
    setErrors((prev) => ({ ...prev, ...newErrors, submit: undefined }));
    return Object.keys(newErrors).length === 0;
  }, [fullName, userProfile, cep]);

  const load = async () => {
    setLoading(true);
    setSuccessMsg(null);
    setErrors({});
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id || null;
      setUid(userId);
      if (!userId) {
        setErrors({ submit: "Você precisa estar autenticado." });
        return;
      }
      const { data: row, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, user_profile, cep")
        .eq("user_id", userId)
        .maybeSingle<ProfileRow>();
      if (error) throw error;
      if (!row) {
        // Perfil inexistente
        setFullName("");
        setUserProfile("");
        setCep("");
        setInitial({ full_name: "", user_profile: "", cep: "" });
      } else {
        setFullName(row.full_name || "");
        setUserProfile(row.user_profile || "");
        setCep(row.cep ? maskCep(row.cep) : "");
        setInitial({ full_name: row.full_name || "", user_profile: row.user_profile || "", cep: row.cep || "" });
      }
    } catch (e: any) {
      setErrors({ submit: e.message || "Erro ao carregar perfil." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!uid) return;
    setSuccessMsg(null);
    setErrors({});
    if (!isValid || !hasChanges) return;
    setSaving(true);
    try {
      // Build changed fields only
      const changed: any = {};
      if (initial && fullName !== (initial.full_name || "")) changed.full_name = fullName.trim();
      if (initial && userProfile !== (initial.user_profile || "")) changed.user_profile = userProfile;
      if (initial && cep !== (initial.cep || "")) changed.cep = cep || null;

      if (Object.keys(changed).length === 0) {
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update(changed)
        .eq("user_id", uid);
      if (error) throw error;

      setInitial({
        full_name: fullName,
        user_profile: userProfile,
        cep: cep || "",
      });
      setSuccessMsg("Perfil atualizado");
    } catch (e: any) {
      setErrors((prev) => ({ ...prev, submit: e.message || "Erro ao salvar." }));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!initial) return;
    setFullName(initial.full_name || "");
    setUserProfile(initial.user_profile || "");
    setCep(initial.cep ? maskCep(initial.cep) : "");
    setSuccessMsg(null);
    setErrors({});
  };

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
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-semibold mt-2 text-center">Perfil do Usuário</h1>

          <Card className="p-5 shadow-ios-md mt-5">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Campo Nome completo</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 text-base"
                    placeholder="Seu nome completo"
                  />
                  {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Dropdown Perfil do usuário</Label>
                  <Select value={userProfile} onValueChange={(v) => setUserProfile(v)}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-popover">
                      {allowedProfiles.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.user_profile && <p className="text-sm text-destructive">{errors.user_profile}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Campo CEP</Label>
                  <Input
                    value={cep}
                    onChange={(e) => setCep(maskCep(e.target.value))}
                    inputMode="numeric"
                    maxLength={9}
                    className="h-12 text-base"
                    placeholder="00000-000"
                  />
                  <p className="text-xs text-muted-foreground">Somente números; usamos para ajustar conteúdos por região</p>
                  {errors.cep && <p className="text-sm text-destructive">{errors.cep}</p>}
                </div>

                {errors.submit && <p className="text-sm text-destructive">{errors.submit}</p>}
                {successMsg && <p className="text-sm text-muted-foreground">{successMsg}</p>}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <Button
                    className="flex-1 h-12 text-base font-semibold"
                    onClick={handleSave}
                    disabled={!isValid || !hasChanges || saving}
                  >
                    Botão Salvar alterações
                  </Button>
                  <button type="button" onClick={handleReset} className="underline text-sm">
                    Link Descartar
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
