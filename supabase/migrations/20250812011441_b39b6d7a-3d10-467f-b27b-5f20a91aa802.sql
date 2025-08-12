-- Ensure timestamp update function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1) Minimal profiles table to hold identity fields
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  user_profile TEXT,
  cep TEXT,
  avatar_url TEXT,
  logo_url TEXT,
  use_logo_as_app_icon BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS: each user can manage only their profile
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger to update updated_at on profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 2) app_settings table (mirror of identity for /settings)
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

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'app_settings' AND policyname = 'Users can view their own app settings'
  ) THEN
    CREATE POLICY "Users can view their own app settings"
    ON public.app_settings FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'app_settings' AND policyname = 'Users can insert their own app settings'
  ) THEN
    CREATE POLICY "Users can insert their own app settings"
    ON public.app_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'app_settings' AND policyname = 'Users can update their own app settings'
  ) THEN
    CREATE POLICY "Users can update their own app settings"
    ON public.app_settings FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger to update updated_at on app_settings
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_app_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) Sync trigger from profiles -> app_settings
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

DROP TRIGGER IF EXISTS trg_sync_app_settings_from_profile ON public.profiles;
CREATE TRIGGER trg_sync_app_settings_from_profile
AFTER INSERT OR UPDATE OF logo_url, use_logo_as_app_icon
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_app_settings_from_profile();

-- 4) Idempotent buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;