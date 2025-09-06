import React from 'react';
import { IOSHeader } from '@/components/ui/unified-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator as CalculatorIcon, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import IOSNavigation from '@/components/ui/ios-navigation';

const Calculator: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="h-screen bg-background">
        <IOSHeader
          title="Calculadora"
          onBack={() => navigate('/dashboard')}
          showBackButton={true}
          showSettingsButton={false}
        />
        
        <main className="flex-1 p-base pb-20 space-y-lg">
          <Card className="shadow-ios-md border-0 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="text-center pb-md">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-md">
                <CalculatorIcon className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-title">Calculadora FlowAgro</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-lg">
              <div className="bg-muted/50 rounded-lg p-lg">
                <Wrench className="mx-auto h-12 w-12 text-muted-foreground mb-md" />
                <h3 className="text-subtitle mb-sm">Em Desenvolvimento</h3>
                <p className="text-body">
                  Estamos trabalhando em uma calculadora especializada para agricultura com funcionalidades como:
                </p>
              </div>
              
              <div className="grid gap-md text-left">
                <div className="flex items-start gap-md p-md bg-card rounded-lg border">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Cálculo de Área</h4>
                    <p className="text-sm text-muted-foreground">Área de plantio, hectares e conversões</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-md p-md bg-card rounded-lg border">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Dosagem de Insumos</h4>
                    <p className="text-sm text-muted-foreground">Fertilizantes, defensivos e sementes</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-md p-md bg-card rounded-lg border">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Produtividade</h4>
                    <p className="text-sm text-muted-foreground">Estimativas de colheita e rendimento</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-md p-md bg-card rounded-lg border">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Custos Operacionais</h4>
                    <p className="text-sm text-muted-foreground">Análise financeira e ROI</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* iOS-style Bottom Navigation */}
      <IOSNavigation />
    </>
  );
};

export default Calculator;