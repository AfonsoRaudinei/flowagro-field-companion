import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BottomNavigationProps {
  className?: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: 'dashboard', 
      path: '/dashboard',
      label: 'Chat',
      icon: MessageCircle
    },
    {
      id: 'settings',
      path: '/settings', 
      label: 'Config',
      icon: Settings
    }
  ];

  const isActiveTab = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50 ${className}`}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-2 px-4">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = isActiveTab(tab.path);
            
            return (
              <Button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                variant="ghost"
                className={`flex flex-col items-center space-y-1 h-auto py-2 px-4 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'text-primary bg-primary/10 shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <IconComponent 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-all duration-200 ${isActive ? 'text-primary' : ''}`} 
                />
                <span className={`text-xs font-medium transition-all duration-200 ${
                  isActive ? 'text-primary font-semibold' : ''
                }`}>
                  {tab.label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNavigation;