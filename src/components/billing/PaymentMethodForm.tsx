import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
}

interface PaymentMethodFormProps {
  plan: Plan;
}

export const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({ plan }) => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    cpf: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Aqui seria integrada a API de pagamento (Stripe, PagSeguro, etc.)
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular processamento
      
      toast({
        title: "Pagamento processado!",
        description: `Assinatura do plano ${plan.name} ativada com sucesso.`
      });
    } catch (error) {
      toast({
        title: "Erro no pagamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0');
    return { value: month, label: month };
  });

  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() + i;
    return { value: year.toString(), label: year.toString() };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b">
        <CreditCard className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Dados do Cartão de Crédito</h3>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Plano {plan.name}</span>
          <span className="font-bold">R$ {plan.price.toFixed(2)}/{plan.period}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cardholder-name">Nome do Titular</Label>
          <Input
            id="cardholder-name"
            placeholder="Nome como está no cartão"
            value={formData.cardholderName}
            onChange={(e) => handleInputChange('cardholderName', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf">CPF do Titular</Label>
          <Input
            id="cpf"
            placeholder="000.000.000-00"
            value={formData.cpf}
            onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
            maxLength={14}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="card-number">Número do Cartão</Label>
          <Input
            id="card-number"
            placeholder="0000 0000 0000 0000"
            value={formData.cardNumber}
            onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
            maxLength={19}
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Mês</Label>
            <Select value={formData.expiryMonth} onValueChange={(value) => handleInputChange('expiryMonth', value)}>
              <SelectTrigger>
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ano</Label>
            <Select value={formData.expiryYear} onValueChange={(value) => handleInputChange('expiryYear', value)}>
              <SelectTrigger>
                <SelectValue placeholder="AAAA" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              placeholder="000"
              value={formData.cvv}
              onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
              maxLength={4}
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <Lock className="h-4 w-4" />
          <span>Seus dados estão seguros e criptografados</span>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={processing}
        >
          {processing ? 'Processando...' : `Confirmar Pagamento R$ ${plan.price.toFixed(2)}`}
        </Button>
      </form>
    </div>
  );
};