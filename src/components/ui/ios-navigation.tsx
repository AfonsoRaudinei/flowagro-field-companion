import React from 'react';
import { MessageSquare, Calculator, Globe, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation';

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
  const { navigate, currentPath, preloadRoute, isActiveRoute } = useOptimizedNavigation();
  const { buttonPress } = useHapticFeedback();
  const isMobile = useIsMobile();

  const tabs: NavigationTab[] = [
    {
      id: 'map',
      path: '/technical-map',
      label: 'Mapa',
      icon: Globe
    },
    {
      id: 'chat', 
      path: '/dashboard',
      label: 'Chat',
      icon: MessageSquare,
      badge: unreadCount
    },
    {
      id: 'calculator',
      path: '/calculator', 
      label: 'Calc',
      icon: Calculator
    }
  ];

  const handleTabPress = (path: string) => {
    if (isMobile) buttonPress();
    navigate(path);
  };

  const handleTabHover = (path: string) => {
    preloadRoute(path);
  };

  const isActiveTab = (id: string, path: string) => {
    return isActiveRoute(path);
  };

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-card/98 backdrop-blur-xl border-t border-border/30",
      "shadow-[0_-8px_32px_-8px_hsl(var(--shadow)/0.12)] pb-safe",
      className
    )}>
      <div className="max-w-sm md:max-w-md mx-auto">
        <div className="flex items-center justify-around px-2 py-1.5 md:px-4 md:py-2">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = isActiveTab(tab.id, tab.path);
            
            return (
              <Button
                key={tab.id}
                onClick={() => handleTabPress(tab.path)}
                onMouseEnter={() => handleTabHover(tab.path)}
                variant="ghost"
                className={cn(
                  "relative flex flex-col items-center gap-1",
                  "h-auto py-2 px-3 rounded-xl min-w-0 flex-1",
                  "transition-all duration-300 ease-out",
                  "active:scale-95 touch-manipulation",
                  isActive 
                    ? "text-primary bg-gradient-to-t from-primary/15 to-primary/5 shadow-sm border border-primary/15 scale-105" 
                    : "text-muted-foreground/70 hover:text-foreground hover:bg-gradient-to-t hover:from-accent/8 hover:to-transparent"
                )}
              >
                <div className="relative">
                  <IconComponent 
                    size={18} 
                    strokeWidth={isActive ? 2.5 : 2}
                    className={cn(
                      "transition-all duration-300 ease-out",
                      isActive && "drop-shadow-sm transform",
                      tab.id === 'map' && isActive && "text-emerald-500",
                      tab.id === 'chat' && isActive && "text-blue-500", 
                      tab.id === 'calculator' && isActive && "text-purple-500"
                    )} 
                  />
                  {tab.badge && tab.badge > 0 && (
                    <Badge 
                      className={cn(
                        "absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1",
                        "text-[10px] font-bold bg-red-500 text-white border-0",
                        "flex items-center justify-center animate-pulse shadow-sm"
                      )}
                    >
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-300 truncate leading-tight",
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