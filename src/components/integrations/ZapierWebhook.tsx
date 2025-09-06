import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ExternalLink, Zap, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export default function ZapierWebhook() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testData, setTestData] = useState(JSON.stringify({
    event_type: 'test',
    producer_name: 'João Silva',
    farm_name: 'Fazenda Boa Vista',
    message: 'Teste de integração com Zapier',
    timestamp: new Date().toISOString()
  }, null, 2));

  const handleTriggerZap = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webhookUrl) {
      toast({
        title: "Erro",
        description: "Por favor, insira a URL do webhook do Zapier",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    logger.info("Triggering Zapier webhook", { url: webhookUrl });

    try {
      let payload;
      try {
        payload = JSON.parse(testData);
      } catch {
        payload = {
          event_type: 'test',
          message: testData,
          timestamp: new Date().toISOString(),
          triggered_from: window.location.origin,
        };
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors", // Add this to handle CORS
        body: JSON.stringify(payload),
      });

      // Since we're using no-cors, we won't get a proper response status
      toast({
        title: "Requisição Enviada",
        description: "A requisição foi enviada para o Zapier. Verifique o histórico do seu Zap para confirmar que foi acionado.",
      });
    } catch (error) {
      logger.error("Error triggering webhook", { error });
      toast({
        title: "Erro",
        description: "Falha ao acionar o webhook do Zapier. Verifique a URL e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestWithSampleData = () => {
    const sampleData = {
      event_type: 'producer.created',
      producer: {
        name: 'Carlos Santos',
        farm_name: 'Fazenda São José',
        location: 'Ribeirão Preto, SP',
        phone: '(16) 99999-9999',
        email: 'carlos@fazenda.com'
      },
      timestamp: new Date().toISOString(),
      source: 'FlowAgro Mobile App'
    };
    
    setTestData(JSON.stringify(sampleData, null, 2));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-orange-500" />
            <div>
              <CardTitle>Integração com Zapier</CardTitle>
              <CardDescription>
                Conecte o FlowAgro com mais de 5000 aplicativos através do Zapier
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Como configurar:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Acesse <a href="https://zapier.com" target="_blank" rel="noopener noreferrer" className="underline">zapier.com</a> e crie uma conta</li>
              <li>Crie um novo Zap e escolha "Webhooks by Zapier" como trigger</li>
              <li>Selecione "Catch Hook" e copie a URL do webhook fornecida</li>
              <li>Cole a URL abaixo e teste a integração</li>
              <li>Configure as ações que deseja executar quando o webhook for acionado</li>
            </ol>
          </div>

          <form onSubmit={handleTriggerZap} className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">URL do Webhook do Zapier</Label>
              <Input
                id="webhook-url"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Cole aqui a URL do webhook fornecida pelo Zapier
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="test-data">Dados de Teste (JSON)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestWithSampleData}
                >
                  Usar Dados de Exemplo
                </Button>
              </div>
              <Textarea
                id="test-data"
                value={testData}
                onChange={(e) => setTestData(e.target.value)}
                placeholder="Cole aqui os dados que deseja enviar para o Zapier"
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !webhookUrl}
              className="w-full"
            >
              {isLoading ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Testar Integração com Zapier
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Eventos Disponíveis</CardTitle>
          <CardDescription>
            Eventos que podem ser enviados automaticamente para o Zapier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {[
              { event: 'producer.created', description: 'Novo produtor cadastrado' },
              { event: 'conversation.started', description: 'Nova conversa iniciada' },
              { event: 'message.received', description: 'Nova mensagem recebida' },
              { event: 'map.analyzed', description: 'Análise de mapa concluída' },
              { event: 'gps.trail_completed', description: 'Trilha GPS concluída' },
              { event: 'data.synced', description: 'Dados sincronizados' },
            ].map(item => (
              <div key={item.event} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Badge variant="outline" className="mb-1">
                    {item.event}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Casos de Uso Populares</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">📧 Email Marketing</h4>
              <p className="text-sm text-muted-foreground">
                Adicione novos produtores automaticamente ao Mailchimp ou SendGrid
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">📊 CRM Integration</h4>
              <p className="text-sm text-muted-foreground">
                Sincronize dados com Pipedrive, HubSpot ou Salesforce
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">💬 Slack Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Receba notificações em tempo real no Slack
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">📈 Google Sheets</h4>
              <p className="text-sm text-muted-foreground">
                Registre dados automaticamente em planilhas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}