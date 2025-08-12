-- Harden functions with explicit search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_app_settings_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_settings (user_id, logo_url, use_logo_as_app_icon)
  VALUES (NEW.user_id, NEW.logo_url, COALESCE(NEW.use_logo_as_app_icon, false))
  ON CONFLICT (user_id) DO UPDATE
    SET logo_url = EXCLUDED.logo_url,
        use_logo_as_app_icon = EXCLUDED.use_logo_as_app_icon,
        updated_at = now();
  RETURN NEW;
END;
$$;