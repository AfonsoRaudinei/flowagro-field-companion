import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, User } from 'lucide-react';

interface AgricultureContextCardProps {
  className?: string;
  producerName: string;
  farmName: string;
  plotName: string;
  culture: string;
  stage: string;
  onClick: () => void;
}

const AgricultureContextCard: React.FC<AgricultureContextCardProps> = ({
  className,
  producerName,
  farmName,
  plotName,
  culture,
  stage,
  onClick
}) => {
  return (
    <Card 
      className={`bg-background/95 backdrop-blur-sm border shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            <User className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground">
              {producerName}, {farmName}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {plotName}, {culture}: {stage}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgricultureContextCard;