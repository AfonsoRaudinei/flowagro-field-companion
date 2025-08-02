import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Wifi, WifiOff, Cloud, CloudOff, CheckCircle, AlertCircle } from 'lucide-react';

interface StatusCardProps {
  className?: string;
  isOnline: boolean;
  syncStatus: 'synced' | 'pending' | 'error';
  weather: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    condition: string;
  };
  onClick?: () => void;
}

const StatusCard: React.FC<StatusCardProps> = ({
  className,
  isOnline,
  syncStatus,
  weather,
  onClick
}) => {
  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Cloud className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <CloudOff className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card 
      className={`bg-background/95 backdrop-blur-sm border shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between space-x-3">
          {/* Network Status */}
          <div className="flex items-center space-x-1">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
          </div>

          {/* Sync Status */}
          <div className="flex items-center">
            {getSyncIcon()}
          </div>

          {/* Weather */}
          <div className="flex items-center text-xs font-medium text-foreground">
            <span className="mr-1">{weather.condition}</span>
            <span>{weather.temperature}°C</span>
            <span className="mx-1">•</span>
            <span>{weather.humidity}%</span>
            <span className="mx-1">•</span>
            <span>{weather.windSpeed}km/h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusCard;