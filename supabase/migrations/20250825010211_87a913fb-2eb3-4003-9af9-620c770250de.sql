-- CORREÇÕES CRÍTICAS DE SEGURANÇA
-- Corrigir avisos do linter de segurança

-- 1. CORRIGIR FUNÇÃO COM SEARCH_PATH MUTÁVEL
-- Recriar função com search_path seguro
DROP FUNCTION IF EXISTS public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Recriar função de sync com search_path seguro  
DROP FUNCTION IF EXISTS public.sync_app_settings_from_profile();

CREATE OR REPLACE FUNCTION public.sync_app_settings_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.app_settings (user_id, logo_url, use_logo_as_app_icon)
  VALUES (NEW.user_id, NEW.logo_url, COALESCE(NEW.use_logo_as_app_icon, false))
  ON CONFLICT (user_id) DO UPDATE
    SET logo_url = EXCLUDED.logo_url,
        use_logo_as_app_icon = EXCLUDED.use_logo_as_app_icon,
        updated_at = now();
  RETURN NEW;
END;
$function$;

-- Recriar função de conversação com search_path seguro
DROP FUNCTION IF EXISTS public.update_conversation_last_seen(uuid);

CREATE OR REPLACE FUNCTION public.update_conversation_last_seen(conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE conversations 
  SET last_seen_at = now(), updated_at = now()
  WHERE id = conversation_id AND user_id = auth.uid();
END;
$function$;

-- 2. CONFIGURAR PARÂMETROS DE SEGURANÇA PARA OTP
-- Reduzir tempo de expiração do OTP para 5 minutos (300 segundos)
ALTER SYSTEM SET auth.otl_token_expire_in = '300';

-- 3. CRIAR FUNÇÃO DE MONITORAMENTO DE SEGURANÇA
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_details JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO security_logs (user_id, event_type, details)
  VALUES (auth.uid(), p_event_type, p_details);
END;
$function$;

-- 4. CRIAR FUNÇÃO PARA VERIFICAR TENTATIVAS SUSPEITAS
CREATE OR REPLACE FUNCTION public.check_suspicious_activity(
  p_user_id UUID DEFAULT auth.uid(),
  p_minutes INTEGER DEFAULT 15
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  failed_attempts INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO failed_attempts
  FROM security_logs
  WHERE user_id = p_user_id
    AND event_type = 'failed_login'
    AND created_at > now() - interval '1 minute' * p_minutes;
    
  RETURN failed_attempts;
END;
$function$;