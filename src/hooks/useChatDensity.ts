import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ChatDensity = 'compact' | 'comfortable' | 'spacious';

interface UserPreferences {
  chat_density: ChatDensity;
}

export function useChatDensity() {
  const [density, setDensity] = useState<ChatDensity>('comfortable');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserPreferences();
  }, []);

  const fetchUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('chat_density')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching preferences:', error);
        return;
      }

      if (data) {
        setDensity(data.chat_density as ChatDensity);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDensity = async (newDensity: ChatDensity) => {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ 
          chat_density: newDensity,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) {
        toast({
          title: "Erro",
          description: "Falha ao salvar preferência",
          variant: "destructive"
        });
        return;
      }

      setDensity(newDensity);
      toast({
        title: "Densidade alterada",
        description: `Cards agora em modo ${newDensity}`,
      });
    } catch (error) {
      console.error('Error updating density:', error);
    }
  };

  return {
    density,
    updateDensity,
    loading
  };
}