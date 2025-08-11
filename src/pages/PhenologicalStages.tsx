import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/contexts/UserContext';

const PhenologicalStages: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cultureStageData, setCultureStageData } = useUser();
  const [selectedCulture, setSelectedCulture] = useState<'soja' | 'milho'>('soja');

  useEffect(() => {
    const stateData = location.state as { selectedCulture?: string };
    if (stateData?.selectedCulture) {
      setSelectedCulture(stateData.selectedCulture as 'soja' | 'milho');
    } else {
      setSelectedCulture(cultureStageData.selectedCulture as 'soja' | 'milho');
    }
  }, [location.state, cultureStageData.selectedCulture]);

  const handleStageSelect = (stage: string) => {
    setCultureStageData({
      selectedCulture,
      selectedStage: stage
    });
    navigate('/dashboard');
  };

  const sojaStages = {
    vegetativos: [
      { code: 'VE', name: 'Emergência', description: 'Cotilédones acima da superfície do solo' },
      { code: 'VC', name: 'Cotilédones expandidos', description: 'Cotilédones completamente expandidos' },
      { code: 'V1', name: 'Primeiro nó', description: 'Folhas unifolioladas completamente desenvolvidas' },
      { code: 'V2', name: 'Segundo nó', description: 'Primeira folha trifoliolada completamente desenvolvida' },
      { code: 'V3', name: 'Terceiro nó', description: 'Segunda folha trifoliolada completamente desenvolvida' },
      { code: 'V4', name: 'Quarto nó', description: 'Terceira folha trifoliolada completamente desenvolvida' },
      { code: 'V5', name: 'Quinto nó', description: 'Quarta folha trifoliolada completamente desenvolvida' },
      { code: 'V6', name: 'Sexto nó', description: 'Quinta folha trifoliolada completamente desenvolvida' }
    ],
    reprodutivos: [
      { code: 'R1', name: 'Início do florescimento', description: 'Uma flor aberta em qualquer nó da haste principal' },
      { code: 'R2', name: 'Florescimento pleno', description: 'Flor aberta no 1º ou 2º nó reprodutivo da haste principal' },
      { code: 'R3', name: 'Início da formação da vagem', description: 'Vagem com 1,5 cm no 1º ao 4º nó reprodutivo' },
      { code: 'R4', name: 'Vagem completamente desenvolvida', description: 'Vagem com 2 a 4 cm no 1º ao 4º nó reprodutivo' },
      { code: 'R5', name: 'Início do enchimento do grão', description: 'Grão com 10% do tamanho final na vagem' },
      { code: 'R6', name: 'Grão verde preenchendo a cavidade', description: 'Vagem contendo grãos verdes preenchendo a cavidade' },
      { code: 'R7', name: 'Início da maturação', description: 'Uma vagem normal na planta com coloração de madura' },
      { code: 'R8', name: 'Maturação plena', description: '95% das vagens com coloração de vagem madura' }
    ]
  };

  const milhoStages = {
    vegetativos: [
      { code: 'VE', name: 'Emergência', description: 'Coleóptilo emerge da superfície do solo' },
      { code: 'V1', name: 'Primeira folha', description: 'Primeira folha com colar visível' },
      { code: 'V2', name: 'Segunda folha', description: 'Segunda folha com colar visível' },
      { code: 'V3', name: 'Terceira folha', description: 'Terceira folha com colar visível' },
      { code: 'V4', name: 'Quarta folha', description: 'Quarta folha com colar visível' },
      { code: 'V5', name: 'Quinta folha', description: 'Quinta folha com colar visível' },
      { code: 'V6', name: 'Sexta folha', description: 'Sexta folha com colar visível' },
      { code: 'VT', name: 'Pendoamento', description: 'Último ramo do pendão completamente visível' }
    ],
    reprodutivos: [
      { code: 'R1', name: 'Embonecamento', description: 'Estigmas visíveis' },
      { code: 'R2', name: 'Grão leitoso', description: 'Grão com aparência leitosa' },
      { code: 'R3', name: 'Grão pastoso', description: 'Grãos amarelos na base, suco leitoso' },
      { code: 'R4', name: 'Grão farináceo', description: 'Grãos consistência pastosa, linha de leite visível' },
      { code: 'R5', name: 'Grão dentado', description: 'Formação da depressão na parte superior dos grãos' },
      { code: 'R6', name: 'Maturidade fisiológica', description: 'Formação da camada preta na inserção dos grãos' }
    ]
  };

  const getCurrentStages = () => {
    return selectedCulture === 'soja' ? sojaStages : milhoStages;
  };

  const renderStageGroup = (title: string, stages: Array<{code: string, name: string, description: string}>) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div className="space-y-3">
        {stages.map((stage) => (
          <Card 
            key={stage.code} 
            className="hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => handleStageSelect(stage.code)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-foreground rounded-md px-2 py-1 text-sm font-mono font-bold min-w-[3rem] text-center">
                  {stage.code}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground mb-1">{stage.name}</h4>
                  <p className="text-sm text-muted-foreground">{stage.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Estádios Fenológicos</h1>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Culture Toggle */}
        <div className="px-4 pb-4">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={selectedCulture === 'soja' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCulture('soja')}
              className="flex-1"
            >
              Soja
            </Button>
            <Button
              variant={selectedCulture === 'milho' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCulture('milho')}
              className="flex-1"
            >
              Milho
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {renderStageGroup('Estádios Vegetativos', getCurrentStages().vegetativos)}
        {renderStageGroup('Estádios Reprodutivos', getCurrentStages().reprodutivos)}
      </div>
    </div>
  );
};

export default PhenologicalStages;