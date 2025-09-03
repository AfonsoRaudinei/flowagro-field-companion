import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, DollarSign } from 'lucide-react';
import { PaymentMethodForm } from './PaymentMethodForm';
import { PIXPayment } from './PIXPayment';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
  color: string;
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 29.90,
    period: 'mês',
    features: [
      'Até 3 produtores',
      'Análise básica de mapas',
      'Suporte por email',
      '5GB de armazenamento'
    ],
    color: 'bg-accent'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 79.90,
    period: 'mês',
    features: [
      'Produtores ilimitados',
      'Análise avançada NDVI',
      'Suporte prioritário',
      '50GB de armazenamento',
      'Relatórios customizados'
    ],
    popular: true,
    color: 'bg-primary'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199.90,
    period: 'mês',
    features: [
      'Todos os recursos Premium',
      'API personalizada',
      'Suporte 24/7',
      'Armazenamento ilimitado',
      'Treinamento da equipe',
      'Integração personalizada'
    ],
    color: 'bg-success'
  }
];

export const BillingSection: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'pix' | null>(null);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setPaymentMethod(null);
  };

  const handlePaymentMethodSelect = (method: 'credit' | 'pix') => {
    setPaymentMethod(method);
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <section aria-labelledby="billing-title" className="space-y-6">
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" />
        <h2 id="billing-title" className="text-lg font-semibold">Planos e Cobrança</h2>
      </div>

      {/* Plans Selection */}
      <div className="grid gap-4">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative p-5 cursor-pointer transition-all duration-200 ${
              selectedPlan === plan.id 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => handleSelectPlan(plan.id)}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 left-4 bg-primary text-primary-foreground">
                Mais Popular
              </Badge>
            )}
            
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">R$ {plan.price.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">/{plan.period}</span>
                </div>
              </div>
              
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedPlan === plan.id 
                  ? 'border-primary bg-primary' 
                  : 'border-muted-foreground'
              }`}>
                {selectedPlan === plan.id && (
                  <Check className="w-2 h-2 text-primary-foreground ml-[1px] mt-[1px]" />
                )}
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {/* Payment Method Selection */}
      {selectedPlan && (
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">Escolha o método de pagamento</h3>
          
          <div className="grid gap-3">
            <Button
              variant={paymentMethod === 'credit' ? 'default' : 'outline'}
              className="justify-start h-auto p-4"
              onClick={() => handlePaymentMethodSelect('credit')}
            >
              <CreditCard className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Cartão de Crédito</div>
                <div className="text-sm text-muted-foreground">Visa, Mastercard, Elo</div>
              </div>
            </Button>

            <Button
              variant={paymentMethod === 'pix' ? 'default' : 'outline'}
              className="justify-start h-auto p-4"
              onClick={() => handlePaymentMethodSelect('pix')}
            >
              <div className="w-5 h-5 mr-3 bg-primary rounded flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">PIX</span>
              </div>
              <div className="text-left">
                <div className="font-medium">PIX</div>
                <div className="text-sm text-muted-foreground">Pagamento instantâneo</div>
              </div>
            </Button>
          </div>
        </Card>
      )}

      {/* Payment Form */}
      {selectedPlanData && paymentMethod && (
        <Card className="p-5">
          {paymentMethod === 'credit' ? (
            <PaymentMethodForm plan={selectedPlanData} />
          ) : (
            <PIXPayment plan={selectedPlanData} />
          )}
        </Card>
      )}
    </section>
  );
};