import React, { useState } from 'react';
import { useWebhooks } from '@/hooks/useWebhooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Webhook, Plus, Play, Trash2, Settings, Activity, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ZapierWebhook from '@/components/integrations/ZapierWebhook';

const AVAILABLE_EVENTS = [
  { value: 'producer.created', label: 'Novo Produtor Criado' },
  { value: 'conversation.started', label: 'Nova Conversa Iniciada' },
  { value: 'message.received', label: 'Nova Mensagem Recebida' },
  { value: 'map.analyzed', label: 'Análise de Mapa Concluída' },
  { value: 'gps.trail_completed', label: 'Trilha GPS Concluída' },
  { value: 'data.synced', label: 'Dados Sincronizados' },
];

export default function WebhookSettings() {
  const { webhooks, logs, loading, createWebhook, updateWebhook, deleteWebhook, testWebhook, fetchLogs } = useWebhooks();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    is_active: true,
    secret_token: '',
    retry_count: 3,
    timeout_seconds: 30,
  });

  const handleCreateWebhook = async () => {
    try {
      if (!formData.name || !formData.url || formData.events.length === 0) {
        toast({
          title: "Erro",
          description: "Nome, URL e pelo menos um evento são obrigatórios",
          variant: "destructive",
        });
        return;
      }

      await createWebhook(formData);
      setShowCreateDialog(false);
      setFormData({
        name: '',
        url: '',
        events: [],
        is_active: true,
        secret_token: '',
        retry_count: 3,
        timeout_seconds: 30,
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleToggleActive = async (webhookId: string, isActive: boolean) => {
    try {
      await updateWebhook(webhookId, { is_active: isActive });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteWebhook = async (webhookId: string, webhookName: string) => {
    if (confirm(`Tem certeza que deseja remover o webhook "${webhookName}"?`)) {
      try {
        await deleteWebhook(webhookId);
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const handleEventToggle = (eventValue: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventValue)
        ? prev.events.filter(e => e !== eventValue)
        : [...prev.events, eventValue]
    }));
  };

  const getStatusColor = (log: any) => {
    if (log.error_message) return 'destructive';
    if (log.response_status >= 200 && log.response_status < 300) return 'default';
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações de Webhook</h1>
          <p className="text-muted-foreground">
            Configure integrações automáticas com sistemas externos
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Webhook</DialogTitle>
              <DialogDescription>
                Configure um webhook para receber notificações de eventos do sistema
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Sistema CRM"
                  />
                </div>
                <div>
                  <Label htmlFor="url">URL do Webhook</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://api.exemplo.com/webhook"
                  />
                </div>
              </div>

              <div>
                <Label>Eventos</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {AVAILABLE_EVENTS.map(event => (
                    <div key={event.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={event.value}
                        checked={formData.events.includes(event.value)}
                        onChange={() => handleEventToggle(event.value)}
                        className="rounded"
                      />
                      <Label htmlFor={event.value} className="text-sm">
                        {event.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="retry_count">Tentativas</Label>
                  <Select value={formData.retry_count.toString()} onValueChange={(v) => setFormData(prev => ({ ...prev, retry_count: parseInt(v) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeout">Timeout (s)</Label>
                  <Select value={formData.timeout_seconds.toString()} onValueChange={(v) => setFormData(prev => ({ ...prev, timeout_seconds: parseInt(v) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="60">60</SelectItem>
                      <SelectItem value="120">120</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>Ativo</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="secret_token">Token de Segurança (Opcional)</Label>
                <Input
                  id="secret_token"
                  value={formData.secret_token}
                  onChange={(e) => setFormData(prev => ({ ...prev, secret_token: e.target.value }))}
                  placeholder="Token para validação de assinatura"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateWebhook}>
                Criar Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="zapier">Zapier</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          {webhooks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Webhook className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum webhook configurado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Configure webhooks para receber notificações automáticas de eventos
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Webhook
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {webhooks.map(webhook => (
                <Card key={webhook.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${webhook.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <div>
                          <CardTitle className="text-lg">{webhook.name}</CardTitle>
                          <CardDescription className="flex items-center space-x-2">
                            <ExternalLink className="w-3 h-3" />
                            <span>{webhook.url}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testWebhook(webhook)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Testar
                        </Button>
                        <Switch
                          checked={webhook.is_active}
                          onCheckedChange={(checked) => handleToggleActive(webhook.id, checked)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteWebhook(webhook.id, webhook.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {webhook.events.map(event => (
                        <Badge key={event} variant="secondary">
                          {AVAILABLE_EVENTS.find(e => e.value === event)?.label || event}
                        </Badge>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Tentativas:</span> {webhook.retry_count}
                      </div>
                      <div>
                        <span className="font-medium">Timeout:</span> {webhook.timeout_seconds}s
                      </div>
                      <div>
                        <span className="font-medium">Criado:</span> {new Date(webhook.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center space-x-4">
            <Select value={selectedWebhook} onValueChange={setSelectedWebhook}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por webhook" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os webhooks</SelectItem>
                {webhooks.map(webhook => (
                  <SelectItem key={webhook.id} value={webhook.id}>
                    {webhook.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => fetchLogs(selectedWebhook || undefined)}
            >
              <Activity className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {logs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum log encontrado</h3>
                <p className="text-muted-foreground">
                  Os logs dos webhooks aparecerão aqui quando forem executados
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Badge variant={getStatusColor(log)}>
                          {log.error_message ? 'Erro' : log.response_status || 'Enviando'}
                        </Badge>
                        <span className="font-medium">{log.event_type}</span>
                        <span className="text-sm text-muted-foreground">
                          Tentativa {log.attempt_number}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    {log.error_message && (
                      <div className="text-sm text-red-600 mb-2">
                        {log.error_message}
                      </div>
                    )}
                    
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground">
                        Ver payload
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </details>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="zapier">
          <ZapierWebhook />
        </TabsContent>
      </Tabs>
    </div>
  );
}