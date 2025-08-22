import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface WebhookConfiguration {
  id: string;
  user_id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  secret_token?: string;
  retry_count: number;
  timeout_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: any;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  attempt_number: number;
  created_at: string;
}

export const useWebhooks = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfiguration[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error: any) {
      console.error('Error fetching webhooks:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os webhooks",
        variant: "destructive",
      });
    }
  };

  const fetchLogs = async (webhookId?: string) => {
    try {
      let query = supabase
        .from('webhook_logs')
        .select(`
          *,
          webhook_configurations!inner(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (webhookId) {
        query = query.eq('webhook_id', webhookId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching webhook logs:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os logs",
        variant: "destructive",
      });
    }
  };

  const createWebhook = async (webhook: Omit<WebhookConfiguration, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('webhook_configurations')
        .insert({
          ...webhook,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setWebhooks(prev => [data, ...prev]);
      toast({
        title: "Sucesso",
        description: "Webhook criado com sucesso",
      });

      return data;
    } catch (error: any) {
      console.error('Error creating webhook:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o webhook",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateWebhook = async (id: string, updates: Partial<WebhookConfiguration>) => {
    try {
      const { data, error } = await supabase
        .from('webhook_configurations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setWebhooks(prev => prev.map(w => w.id === id ? data : w));
      toast({
        title: "Sucesso",
        description: "Webhook atualizado com sucesso",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating webhook:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o webhook",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      const { error } = await supabase
        .from('webhook_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWebhooks(prev => prev.filter(w => w.id !== id));
      toast({
        title: "Sucesso",
        description: "Webhook removido com sucesso",
      });
    } catch (error: any) {
      console.error('Error deleting webhook:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o webhook",
        variant: "destructive",
      });
      throw error;
    }
  };

  const testWebhook = async (webhook: WebhookConfiguration) => {
    try {
      const testPayload = {
        user_id: webhook.user_id,
        event_type: 'test',
        data: {
          message: 'Teste de webhook do FlowAgro',
          timestamp: new Date().toISOString(),
        }
      };

      const { data, error } = await supabase.functions.invoke('webhook-sender', {
        body: testPayload
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Webhook de teste enviado com sucesso",
      });

      // Refresh logs to show the test
      await fetchLogs(webhook.id);

      return data;
    } catch (error: any) {
      console.error('Error testing webhook:', error);
      toast({
        title: "Erro",
        description: "Não foi possível testar o webhook",
        variant: "destructive",
      });
      throw error;
    }
  };

  const sendWebhook = async (eventType: string, data: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: result, error } = await supabase.functions.invoke('webhook-sender', {
        body: {
          user_id: user.id,
          event_type: eventType,
          data
        }
      });

      if (error) throw error;
      return result;
    } catch (error: any) {
      console.error('Error sending webhook:', error);
      throw error;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchWebhooks(), fetchLogs()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    webhooks,
    logs,
    loading,
    fetchWebhooks,
    fetchLogs,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    sendWebhook,
  };
};