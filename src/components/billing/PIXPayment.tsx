import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
}

interface PIXPaymentProps {
  plan: Plan;
}

export const PIXPayment: React.FC<PIXPaymentProps> = ({ plan }) => {
  const { toast } = useToast();
  const [pixCode, setPixCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 minutos em segundos
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed'>('pending');

  // Gerar PIX code e QR code (simulado)
  useEffect(() => {
    const generatePIXCode = () => {
      // Em produção, isso viria da API do provedor de pagamento
      const code = `00020126580014br.gov.bcb.pix0136${Math.random().toString(36).substring(7)}520400005303986540${plan.price.toFixed(2)}5802BR5925FLOWAGRO TECNOLOGIA LTDA6008SAO PAULO62070503***6304`;
      setPixCode(code);
      
      // URL do QR code (normalmente gerado pelo provedor)
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code)}`);
    };

    generatePIXCode();
  }, [plan.price]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining > 0 && paymentStatus === 'pending') {
      const timer = setTimeout(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, paymentStatus]);

  // Simular verificação de pagamento
  useEffect(() => {
    if (paymentStatus === 'pending') {
      const checkPayment = setTimeout(() => {
        // Em produção, isso seria uma consulta real à API
        const isPaid = Math.random() > 0.7; // 30% chance de "pagamento" para demo
        if (isPaid) {
          setPaymentStatus('completed');
          toast({
            title: "Pagamento confirmado!",
            description: `Assinatura do plano ${plan.name} ativada com sucesso.`
          });
        }
      }, 10000); // Verificar a cada 10 segundos

      return () => clearTimeout(checkPayment);
    }
  }, [paymentStatus, plan.name, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    toast({
      title: "Código copiado!",
      description: "Código PIX copiado para a área de transferência."
    });
  };

  const handleManualPaymentCheck = () => {
    setPaymentStatus('processing');
    toast({
      title: "Verificando pagamento...",
      description: "Aguarde enquanto confirmamos seu pagamento."
    });
    
    setTimeout(() => {
      setPaymentStatus('completed');
      toast({
        title: "Pagamento confirmado!",
        description: `Assinatura do plano ${plan.name} ativada com sucesso.`
      });
    }, 3000);
  };

  if (paymentStatus === 'completed') {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="h-16 w-16 text-success mx-auto" />
        <h3 className="text-xl font-semibold text-success">Pagamento Confirmado!</h3>
        <p className="text-muted-foreground">
          Sua assinatura do plano {plan.name} foi ativada com sucesso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b">
        <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
          <span className="text-xs font-bold text-primary-foreground">PIX</span>
        </div>
        <h3 className="font-semibold">Pagamento via PIX</h3>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Plano {plan.name}</span>
          <span className="font-bold">R$ {plan.price.toFixed(2)}</span>
        </div>
      </div>

      {timeRemaining > 0 ? (
        <>
          <Card className="p-4 bg-warning/10 border-warning">
            <div className="flex items-center gap-2 text-warning">
              <Clock className="h-4 w-4" />
              <span className="font-medium">
                Tempo restante: {formatTime(timeRemaining)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              O código PIX expira em 15 minutos
            </p>
          </Card>

          <div className="text-center space-y-4">
            <div className="bg-white p-4 rounded-lg inline-block">
              <img 
                src={qrCodeUrl} 
                alt="QR Code PIX" 
                className="w-48 h-48 mx-auto"
              />
            </div>
            
            <p className="text-sm text-muted-foreground">
              Escaneie o QR Code com seu app bancário ou copie o código abaixo
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Código PIX:</label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-muted rounded-lg text-xs font-mono break-all">
                {pixCode}
              </div>
              <Button variant="outline" size="sm" onClick={copyPixCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm space-y-1">
              <p><strong>1.</strong> Abra o app do seu banco</p>
              <p><strong>2.</strong> Escolha a opção PIX</p>
              <p><strong>3.</strong> Escaneie o QR Code ou cole o código</p>
              <p><strong>4.</strong> Confirme o pagamento</p>
            </div>

            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleManualPaymentCheck}
              disabled={paymentStatus === 'processing'}
            >
              {paymentStatus === 'processing' ? 'Verificando...' : 'Já paguei - Verificar pagamento'}
            </Button>
          </div>
        </>
      ) : (
        <Card className="p-6 text-center bg-destructive/10 border-destructive">
          <p className="text-destructive font-medium">Código PIX expirado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Gere um novo código para continuar com o pagamento
          </p>
          <Button className="mt-4" onClick={() => setTimeRemaining(15 * 60)}>
            Gerar novo código
          </Button>
        </Card>
      )}
    </div>
  );
};