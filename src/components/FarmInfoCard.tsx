import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@/contexts/UserContext';
import { Wheat } from 'lucide-react';
interface FarmInfoCardProps {
  className?: string;
}
const FarmInfoCard: React.FC<FarmInfoCardProps> = ({
  className
}) => {
  const navigate = useNavigate();
  const {
    selectedProducer,
    ownFarm,
    isProdutor,
    cultureStageData
  } = useUser();
  const getCultureIcon = (culture: string) => {
    switch (culture) {
      case 'soja':
      case 'milho':
      case 'algodao':
        return <Wheat className="w-4 h-4" />;
      default:
        return <Wheat className="w-4 h-4" />;
    }
  };
  const getCultureLabel = (culture: string) => {
    switch (culture) {
      case 'soja':
        return 'Soja';
      case 'milho':
        return 'Milho';
      case 'algodao':
        return 'Algodão';
      default:
        return 'Soja';
    }
  };
  const handlePhenologicalStagesClick = () => {
    navigate('/phenological-stages', {
      state: {
        selectedCulture: cultureStageData.selectedCulture
      }
    });
  };
  const currentProducer = selectedProducer || ownFarm;
  return <Card className={`bg-background/50 backdrop-blur-sm shadow-md border-0 rounded-lg ${className}`}>
      <CardContent className="p-3 mx-[47px] my-[44px]">
        {/* Primeira linha - Nome do produtor */}
        <div className="text-foreground font-light text-left mb-1 text-sm">
          {currentProducer?.name || 'José Augusto Miranda'}
        </div>
        
        {/* Segunda linha - Nome da fazenda */}
        <div className="text-muted-foreground font-light text-left mb-2 text-xs">
          {currentProducer?.farm || 'Fazenda São João'}
        </div>
        
        {/* Terceira linha - Cultura e estádio clicável */}
        <div className="flex items-center gap-2 cursor-pointer hover:bg-accent/30 rounded-md p-1 -m-1 transition-colors" onClick={handlePhenologicalStagesClick}>
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white">
            {getCultureIcon(cultureStageData.selectedCulture)}
          </div>
          <div className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-medium">
            {cultureStageData.selectedStage?.toUpperCase() || 'V5'}
          </div>
          <div className="text-xs text-muted-foreground ml-1">
            {getCultureLabel(cultureStageData.selectedCulture)}
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default FarmInfoCard;