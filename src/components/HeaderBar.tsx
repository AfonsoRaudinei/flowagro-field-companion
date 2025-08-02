import React from 'react';
import { ArrowLeft, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StatusCard from './StatusCard';

interface HeaderBarProps {
  onBack: () => void;
  weatherData: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    condition: string;
  };
  isOnline: boolean;
  syncStatus: 'synced' | 'pending' | 'error';
  currentTime: string;
  userName?: string;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  onBack,
  weatherData,
  isOnline,
  syncStatus,
  currentTime,
  userName
}) => {
  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start">
      {/* Left side - Time, User and Weather/Back grouped */}
      <div className="flex items-center space-x-3">
        <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center text-sm font-medium text-foreground space-x-2">
                <Clock className="w-4 h-4" />
                <span>{currentTime}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-primary" />
                {userName && (
                  <span className="text-xs text-muted-foreground">{userName.split(' ')[0]}</span>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Status Card */}
      <StatusCard
        isOnline={isOnline}
        syncStatus={syncStatus}
        weather={weatherData}
      />
    </div>
  );
};

export default HeaderBar;