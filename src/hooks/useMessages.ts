import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { reportSupabaseError } from '@/integrations/supabase/errors';
import { logger } from '@/lib/logger';
import { WebhookTrigger } from '@/lib/webhookTrigger';

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'producer' | 'ai';
  sender_id?: string;
  content: string;
  message_type: 'text' | 'audio' | 'image' | 'file';
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export function useMessages(conversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        reportSupabaseError('useMessages.fetchMessages', error);
        return;
      }

      setMessages((data || []).map(item => ({
        ...item,
        sender_type: item.sender_type as 'user' | 'producer' | 'ai',
        message_type: item.message_type as 'text' | 'audio' | 'image' | 'file',
        metadata: item.metadata as Record<string, any>
      })));
    } catch (error) {
      reportSupabaseError('useMessages.fetchMessages', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const sendMessage = useCallback(async (
    content: string, 
    messageType: 'text' | 'audio' | 'image' | 'file' = 'text',
    senderType: 'user' | 'ai' = 'user',
    metadata: Record<string, any> = {}
  ) => {
    if (!conversationId || !content.trim()) return null;

    try {
      setSendingMessage(true);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: senderType,
          content: content.trim(),
          message_type: messageType,
          metadata,
          is_read: false
        })
        .select()
        .single();

      if (error) {
        reportSupabaseError('useMessages.sendMessage', error);
        return null;
      }

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      // Add to local state immediately for better UX
      const typedData: Message = {
        ...data,
        sender_type: data.sender_type as 'user' | 'producer' | 'ai',
        message_type: data.message_type as 'text' | 'audio' | 'image' | 'file',
        metadata: data.metadata as Record<string, any>
      };
      setMessages(prev => [...prev, typedData]);
      
      return data;
    } catch (error) {
      reportSupabaseError('useMessages.sendMessage', error);
      return null;
    } finally {
      setSendingMessage(false);
    }
  }, [conversationId]);

  const sendAIMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;

    try {
      // First send user message
      const userMsg = await sendMessage(userMessage, 'text', 'user');
      if (!userMsg) return;

      // Add typing indicator
      const typingMessage: Message = {
        id: 'typing-' + Date.now(),
        conversation_id: conversationId!,
        sender_type: 'ai',
        content: 'I.A Ludmila está digitando...',
        message_type: 'text',
        metadata: { isTyping: true },
        is_read: false,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, typingMessage]);

      // Call AI Edge Function
      const { data: aiResponse, error } = await supabase.functions.invoke('ai-chat', {
        body: { message: userMessage }
      });

      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== typingMessage.id));

      if (error) {
        logger.error('AI Error', { error });
        await sendMessage(
          'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
          'text',
          'ai'
        );
        return;
      }

      if (aiResponse?.answer) {
        await sendMessage(aiResponse.answer, 'text', 'ai', {
          source: aiResponse.source || 'general',
          correlation_id: aiResponse.correlation_id
        });
      } else {
        await sendMessage(
          'Não consegui gerar uma resposta. Tente reformular sua pergunta.',
          'text',
          'ai'
        );
      }
    } catch (error) {
      // Remove typing indicator in case of error
      setMessages(prev => prev.filter(m => !m.metadata?.isTyping));
      reportSupabaseError('useMessages.sendAIMessage', error);
      
      await sendMessage(
        'Ocorreu um erro interno. Nossa equipe foi notificada.',
        'text',
        'ai'
      );
    }
  }, [conversationId, sendMessage]);

  useEffect(() => {
    let isMounted = true;
    
    fetchMessages();

    if (!conversationId) return;

    // Set up realtime subscription for this conversation
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          if (!isMounted) return;
          
          const rawMessage = payload.new as any;
          const newMessage: Message = {
            ...rawMessage,
            sender_type: rawMessage.sender_type as 'user' | 'producer' | 'ai',
            message_type: rawMessage.message_type as 'text' | 'audio' | 'image' | 'file',
            metadata: rawMessage.metadata as Record<string, any>
          };
          
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      logger.debug('Cleaning up messages subscription', { conversationId });
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages]);

  return {
    messages,
    loading,
    sendingMessage,
    sendMessage,
    sendAIMessage,
    refetch: fetchMessages
  };
}