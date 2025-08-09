import { toast } from "@/hooks/use-toast";

// Standardized Supabase error reporting
export function reportSupabaseError(context: string, error: unknown, opts?: { showToast?: boolean }) {
  const showToast = opts?.showToast ?? true;
  const correlationId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const message = error instanceof Error ? error.message : String(error);

  if (showToast) {
    toast({ title: "Erro de dados", description: "Falha ao carregar dados.", variant: "destructive" });
  }

  // Keep logs structured and short
  console.error("[SUPABASE]", { context, correlationId, message });
}
