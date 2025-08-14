import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { reportSupabaseError } from '@/integrations/supabase/errors';

export interface Producer {
  id: string;
  name: string;
  farm_name: string;
  location?: string;
  avatar_url?: string;
  phone?: string;
  email?: string;
  is_online: boolean;
  last_seen?: string;
  created_at: string;
  updated_at: string;
}

export function useProducers() {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('producers')
        .select('*')
        .order('name');

      if (error) {
        reportSupabaseError('useProducers.fetchProducers', error);
        return;
      }

      setProducers(data || []);
    } catch (error) {
      reportSupabaseError('useProducers.fetchProducers', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProducerOnlineStatus = async (id: string, isOnline: boolean) => {
    try {
      const updateData: any = {
        is_online: isOnline,
        updated_at: new Date().toISOString()
      };

      if (!isOnline) {
        updateData.last_seen = new Date().toISOString();
      }

      const { error } = await supabase
        .from('producers')
        .update(updateData)
        .eq('id', id);

      if (error) {
        reportSupabaseError('useProducers.updateOnlineStatus', error);
        return;
      }

      // Update local state
      setProducers(prev => 
        prev.map(p => 
          p.id === id 
            ? { ...p, is_online: isOnline, last_seen: updateData.last_seen } 
            : p
        )
      );
    } catch (error) {
      reportSupabaseError('useProducers.updateOnlineStatus', error);
    }
  };

  useEffect(() => {
    fetchProducers();

    // Set up realtime subscription
    const channel = supabase
      .channel('producers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'producers'
        },
        (payload) => {
          console.log('Producer update:', payload);
          fetchProducers(); // Refresh data on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    producers,
    loading,
    refetch: fetchProducers,
    updateOnlineStatus: updateProducerOnlineStatus
  };
}