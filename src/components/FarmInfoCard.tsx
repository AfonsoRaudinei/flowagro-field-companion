import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  const sojaStages = [
    { value: 've', label: 'VE' },
    { value: 'vc', label: 'VC' },
    { value: 'v1', label: 'V1' },
    { value: 'v2', label: 'V2' },
    { value: 'v3', label: 'V3' },
    { value: 'r1', label: 'R1' },
    { value: 'r2', label: 'R2' },
    { value: 'r3', label: 'R3' },
    { value: 'r4', label: 'R4' },
    { value: 'r5', label: 'R5' },
    { value: 'r6', label: 'R6' },
    { value: 'r7', label: 'R7' },
    { value: 'r8', label: 'R8' }
  ];

  const milhoStages = [
    { value: 've', label: 'VE' },
    { value: 'v1', label: 'V1' },
    { value: 'v2', label: 'V2' },
    { value: 'v3', label: 'V3' },
    { value: 'v4', label: 'V4' },
    { value: 'v5', label: 'V5' },
    { value: 'v6', label: 'V6' },
    { value: 'vt', label: 'VT' },
    { value: 'r1', label: 'R1' },
    { value: 'r2', label: 'R2' },
    { value: 'r3', label: 'R3' },
    { value: 'r4', label: 'R4' },
    { value: 'r5', label: 'R5' },
    { value: 'r6', label: 'R6' }
  ];

  const algodaoStages = [
    { value: 've', label: 'VE' },
    { value: 'v1', label: 'V1' },
    { value: 'v2', label: 'V2' },
    { value: 'b1', label: 'B1' },
    { value: 'b2', label: 'B2' },
    { value: 'f1', label: 'F1' },
    { value: 'f2', label: 'F2' },
    { value: 'c1', label: 'C1' },
    { value: 'c2', label: 'C2' }
  ];

  const getStagesForCulture = () => {
    switch (selectedCulture) {
      case 'soja':
        return sojaStages;
      case 'milho':
        return milhoStages;
      case 'algodao':
        return algodaoStages;
      default:
        return sojaStages;
    }
  };

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
                {getStagesForCulture().map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
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