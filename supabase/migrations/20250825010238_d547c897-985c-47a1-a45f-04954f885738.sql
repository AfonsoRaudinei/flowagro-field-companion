-- CORREÇÕES CRÍTICAS DE SEGURANÇA (Parte 2)
-- Corrigir problemas de dependências

-- 1. CORRIGIR FUNÇÃO COM SEARCH_PATH MUTÁVEL (COM CASCADE)
-- Primeiro, recriar a função com search_path seguro mantendo a assinatura
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