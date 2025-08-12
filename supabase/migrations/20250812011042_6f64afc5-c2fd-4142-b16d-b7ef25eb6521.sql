-- Tabela por usuário para refletir a seção "Identidade do App" do /settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  app_name TEXT DEFAULT 'FlowAgro',
  logo_url TEXT,
  use_logo_as_app_icon BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policies básicas: usuário enxerga/gera/atualiza seu próprio settings
CREATE POLICY "Users can view their own app settings"
ON public.app_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own app settings"
ON public.app_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own app settings"
ON public.app_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger de updated_at
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Sempre que o perfil for criado/atualizado, refletir no app_settings
CREATE OR REPLACE FUNCTION public.sync_app_settings_from_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.app_settings (user_id, logo_url, use_logo_as_app_icon)
  VALUES (NEW.user_id, NEW.logo_url, COALESCE(NEW.use_logo_as_app_icon, false))
  ON CONFLICT (user_id) DO UPDATE
    SET logo_url = EXCLUDED.logo_url,
        use_logo_as_app_icon = EXCLUDED.use_logo_as_app_icon,
        updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dispara no insert e update do profile
DROP TRIGGER IF EXISTS trg_sync_app_settings_from_profile ON public.profiles;
CREATE TRIGGER trg_sync_app_settings_from_profile
AFTER INSERT OR UPDATE OF logo_url, use_logo_as_app_icon
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_app_settings_from_profile();

-- Buckets com idempotência
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;