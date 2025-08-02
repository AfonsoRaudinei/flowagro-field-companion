import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStagesForCulture, formatStageForUI } from '@/data/phenologicalStages';

interface FarmInfoCardProps {
  className?: string;
  selectedCulture: string;
  selectedStage: string;
  onCultureChange: (culture: string) => void;
  onStageChange: (stage: string) => void;
  onStagesClick: () => void;
}

const FarmInfoCard: React.FC<FarmInfoCardProps> = ({
  className,
  selectedCulture,
  selectedStage,
  onCultureChange,
  onStageChange,
  onStagesClick
}) => {
  const cultures = [
    { value: 'soja', label: 'Soja' },
    { value: 'milho', label: 'Milho' },
    { value: 'algodao', label: 'Algodão' }
  ];

  // Buscar estádios dinamicamente baseado na cultura selecionada
  const availableStages = getStagesForCulture(selectedCulture);

  return (
    <Card className={`bg-background/95 backdrop-blur-sm border shadow-lg ${className}`}>
      <CardContent className="p-4">
        <div className="text-sm font-medium text-muted-foreground mb-3">Minha Fazenda</div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Cultura</label>
            <Select value={selectedCulture} onValueChange={onCultureChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cultures.map((culture) => (
                  <SelectItem key={culture.value} value={culture.value}>
                    {culture.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Estádio</label>
            <Select value={selectedStage} onValueChange={onStageChange}>
              <SelectTrigger className="h-9" onClick={onStagesClick}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableStages.map((stage) => (
                  <SelectItem key={stage.code} value={stage.code}>
                    {formatStageForUI(stage.code)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FarmInfoCard;