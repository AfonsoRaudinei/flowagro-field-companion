import React, { useState, useRef, useEffect } from 'react';
import { Map, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TechnicalMap from '@/pages/TechnicalMap';
import Dashboard from '@/pages/Dashboard';
import Settings from '@/pages/Settings';

interface SwipeNavigationProps {
  className?: string;
}

const SwipeNavigation: React.FC<SwipeNavigationProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState(0); // 0: Map, 1: Chat, 2: Profile
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);

  const tabs = [
    {
      id: 'technical-map',
      label: 'Mapa',
      icon: Map,
      component: TechnicalMap
    },
    {
      id: 'chat',
      label: 'Chat', 
      icon: MessageCircle,
      component: Dashboard
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: User,
      component: Settings
    }
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isTransitioning) return;
    currentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || isTransitioning) return;
    
    const deltaX = currentX.current - startX.current;
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && activeTab > 0) {
        // Swipe right - previous tab
        changeTab(activeTab - 1);
      } else if (deltaX < 0 && activeTab < tabs.length - 1) {
        // Swipe left - next tab
        changeTab(activeTab + 1);
      }
    }
    
    isDragging.current = false;
  };

  const changeTab = (newTab: number) => {
    if (newTab === activeTab || isTransitioning) return;
    
    setIsTransitioning(true);
    setActiveTab(newTab);
    
    // Reset transition state after animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const getCurrentComponent = () => {
    const CurrentComponent = tabs[activeTab].component;
    return <CurrentComponent />;
  };

  return (
    <div className={`flex flex-col h-screen bg-background ${className}`}>
      {/* Main Content Area with Swipe */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`h-full transition-transform duration-300 ease-out ${
            isTransitioning ? '' : ''
          }`}
          style={{
            transform: `translateX(-${activeTab * 100}%)`,
            width: '300%',
            display: 'flex'
          }}
        >
          {tabs.map((tab, index) => {
            const Component = tab.component;
            return (
              <div key={tab.id} className="w-1/3 h-full">
                <Component />
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-around py-2 px-4">
            {tabs.map((tab, index) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === index;
              
              return (
                <Button
                  key={tab.id}
                  onClick={() => changeTab(index)}
                  variant="ghost"
                  disabled={isTransitioning}
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
    </div>
  );
};

export default SwipeNavigation;