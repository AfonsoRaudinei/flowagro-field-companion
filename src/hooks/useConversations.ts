import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { reportSupabaseError } from '@/integrations/supabase/errors';
import { logger } from '@/lib/logger';

export interface Conversation {
  id: string;
  user_id: string;
  producer_id: string;
  title?: string;
  is_pinned: boolean;
  unread_count: number;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  producer?: {
    id: string;
    name: string;
    farm_name: string;
    location?: string;
    avatar_url?: string;
    is_online: boolean;
  };
  last_message?: {
    content: string;
    message_type: string;
    created_at: string;
  };
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          producer:producers(
            id,
            name,
            farm_name,
            location,
            avatar_url,
            is_online
          ),
          last_message:messages(
            content,
            message_type,
            created_at
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        reportSupabaseError('useConversations.fetchConversations', error);
        return;
      }

      // Process the data to get only the latest message for each conversation
      const processedData = (data || []).map(conv => ({
        ...conv,
        last_message: Array.isArray(conv.last_message) ? conv.last_message[0] : conv.last_message
      }));

      setConversations(processedData);
    } catch (error) {
      reportSupabaseError('useConversations.fetchConversations', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const togglePin = useCallback(async (conversationId: string) => {
    try {
      // Find current conversation
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      const { error } = await supabase
        .from('conversations')
        .update({ 
          is_pinned: !conversation.is_pinned,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        reportSupabaseError('useConversations.togglePin', error);
        return;
      }

      // Update local state
      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId
            ? { ...c, is_pinned: !c.is_pinned }
            : c
        )
      );
    } catch (error) {
      reportSupabaseError('useConversations.togglePin', error);
    }
  }, [conversations]);

  const createConversation = useCallback(async (producerId: string, title?: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userData.user.id,
          producer_id: producerId,
          title: title || null,
          is_pinned: false,
          unread_count: 0
        })
        .select()
        .single();

      if (error) {
        reportSupabaseError('useConversations.createConversation', error);
        return null;
      }

      await fetchConversations(); // Refresh list
      return data;
    } catch (error) {
      reportSupabaseError('useConversations.createConversation', error);
      return null;
    }
  }, [fetchConversations]);

  useEffect(() => {
    let isMounted = true;
    
    fetchConversations();

    // Set up realtime subscription
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          if (!isMounted) return;
          logger.debug('Conversations update received');
          fetchConversations(); // Refresh on any change
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      logger.debug('Cleaning up conversations subscription');
      supabase.removeChannel(channel);
    };
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    refetch: fetchConversations,
    togglePin,
    createConversation
  };
}