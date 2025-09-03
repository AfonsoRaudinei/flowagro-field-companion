import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Calculator, Map, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NavigationTab {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface IOSNavigationProps {
  className?: string;
  unreadCount?: number;
}

const IOSNavigation: React.FC<IOSNavigationProps> = ({ 
  className,
  unreadCount = 0 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs: NavigationTab[] = [
    {
      id: 'map',
      path: '/technical-map',
      label: 'Mapa',
      icon: Map
    },
    {
      id: 'chat', 
      path: '/dashboard',
      label: 'Chat',
      icon: MessageCircle,
      badge: unreadCount
    },
    {
      id: 'calculator',
      path: '/calculator', 
      label: 'Calc',
      icon: Calculator
    }
  ];

  const isActiveTab = (id: string, path: string) => {
    if (id === 'map') return location.pathname === '/technical-map';
    if (id === 'chat') return location.pathname === '/dashboard';
    if (id === 'calculator') return location.pathname === '/calculator';
    return location.pathname === path;
  };

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-card/95 backdrop-blur-md border-t border-border/50",
      "shadow-ios-lg pb-safe", // Handle iPhone home indicator
      className
    )}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around px-md py-sm">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = isActiveTab(tab.id, tab.path);
            
            return (
              <Button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                variant="ghost"
                className={cn(
                  "ios-button relative flex flex-col items-center gap-xs",
                  "h-auto py-sm px-md rounded-lg min-w-0 flex-1",
                  "transition-all duration-300 hover-lift",
                  isActive 
                    ? "text-primary bg-gradient-to-t from-primary/20 to-primary/10 shadow-ios-sm border border-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-t hover:from-accent/10 hover:to-transparent"
                )}
              >
                <div className="relative">
                  <IconComponent 
                    size={22} 
                    strokeWidth={isActive ? 2.5 : 2}
                    className={cn(
                      "transition-all duration-300",
                      isActive && "drop-shadow-sm"
                    )} 
                  />
                  {tab.badge && tab.badge > 0 && (
                    <Badge 
                      className={cn(
                        "absolute -top-2 -right-2 h-5 min-w-5 px-1",
                        "text-xs font-bold bg-destructive text-destructive-foreground",
                        "flex items-center justify-center animate-pulse"
                      )}
                    >
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-ios-xs font-medium transition-all duration-300 truncate",
                  isActive && "font-semibold text-primary"
                )}>
                  {tab.label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default IOSNavigation;