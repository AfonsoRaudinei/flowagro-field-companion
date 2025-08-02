import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getStagesByCategory } from '@/data/phenologicalStages';

const PhenologicalStages: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCulture, setSelectedCulture] = useState<'soja' | 'milho' | 'algodao'>('soja');

  // Usar dados centralizados
  const vegetativeStages = getStagesByCategory(selectedCulture, 'vegetativo');
  const reproductiveStages = getStagesByCategory(selectedCulture, 'reprodutivo');

  const renderStageGroup = (title: string, stages: Array<{code: string, name: string, fullDescription: string}>) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div className="space-y-3">
        {stages.map((stage) => (
          <Card key={stage.code} className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-foreground rounded-md px-2 py-1 text-sm font-mono font-bold min-w-[3rem] text-center">
                  {stage.code}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground mb-1">{stage.name}</h4>
                  <p className="text-sm text-muted-foreground">{stage.fullDescription}</p>
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
            <Button
              variant={selectedCulture === 'algodao' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCulture('algodao')}
              className="flex-1"
            >
              Algodão
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {renderStageGroup('Estádios Vegetativos', vegetativeStages)}
        {renderStageGroup('Estádios Reprodutivos', reproductiveStages)}
      </div>
    </div>
  );
};

export default PhenologicalStages;