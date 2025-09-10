import React from 'react';
import { IOSHeader } from '@/components/ui/unified-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator as CalculatorIcon, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Calculator: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-background">
      <IOSHeader
        title="Calculadora"
        onBack={() => navigate('/dashboard')}
      />

      <main className="flex-1 overflow-auto px-4 py-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 text-purple-600">
                <CalculatorIcon size={18} strokeWidth={2} />
              </div>
              Calculadora FlowAgro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-amber-200/50 bg-gradient-to-br from-amber-50/50 to-orange-50/50 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-amber-600">
                  <Wrench size={16} strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-amber-800">Em Desenvolvimento</h3>
              </div>
              <p className="text-sm text-amber-700 leading-relaxed">
                Estamos desenvolvendo uma calculadora completa para auxiliar você nas operações agrícolas do dia a dia.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Funcionalidades Planejadas:</h4>
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-foreground">Cálculo de Área</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-foreground">Dosagem de Insumos</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-sm font-medium text-foreground">Produtividade</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-sm font-medium text-foreground">Custos Operacionais</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Calculator;