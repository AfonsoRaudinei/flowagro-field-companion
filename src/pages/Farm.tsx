import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Badge } from '@/components/ui/badge';
import { Sprout } from 'lucide-react';

const Farm: React.FC = () => {
  const navigate = useNavigate();
  const { ownFarm, selectedProducer, isConsultor } = useUser();

  // Use selected producer for consultants, own farm for producers
  const currentFarm = isConsultor ? selectedProducer : ownFarm;
  
  // Simulated data - in real app this would come from Supabase
  const producerName = currentFarm?.name || "João Silva";
  const farmName = currentFarm?.farm || "Fazenda Boa Vista";
  const currentCrop = "Soja";
  const currentStage = "V3";

  const handleCropStageClick = () => {
    navigate('/phenological-stages');
  };

  return (
    <div className="w-full max-w-md mx-auto bg-background min-h-screen p-4">
      {/* Farm Identification */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-foreground">
          <span className="font-medium text-base">{producerName}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground text-sm">{farmName}</span>
        </div>
      </div>

      {/* Crop + Stage Block */}
      <div 
        onClick={handleCropStageClick}
        className="flex items-center gap-4 p-4 bg-card rounded-lg border cursor-pointer transition-all duration-200 hover:bg-accent/50 active:scale-95"
      >
        {/* Crop Icon */}
        <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full">
          <Sprout className="w-6 h-6 text-white" />
        </div>

        {/* Crop Info */}
        <div className="flex flex-col gap-1">
          <span className="font-medium text-foreground">{currentCrop}</span>
          <Badge variant="secondary" className="w-fit text-xs">
            {currentStage}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default Farm;