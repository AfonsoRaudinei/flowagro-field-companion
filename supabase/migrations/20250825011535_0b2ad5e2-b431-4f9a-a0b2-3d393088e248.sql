-- Completar as políticas DELETE pendentes para finalizar a segurança

-- Política DELETE para app_settings
CREATE POLICY "Users can delete their own app settings" 
ON public.app_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Política DELETE para user_preferences  
CREATE POLICY "Users can delete their own preferences"
ON public.user_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Adicionar comentários de segurança para documentação
COMMENT ON POLICY "Users can delete their own app settings" ON public.app_settings 
IS 'Permite que usuários deletem suas próprias configurações do app';

COMMENT ON POLICY "Users can delete their own preferences" ON public.user_preferences
IS 'Permite que usuários deletem suas próprias preferências';