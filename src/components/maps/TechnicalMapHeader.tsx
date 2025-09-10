import React from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation';

export const TechnicalMapHeader: React.FC = () => {
  const { navigate } = useOptimizedNavigation();

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background border-b border-border shadow-sm">
      <div className="flex items-center justify-between h-full px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-10 w-10"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Settings Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSettings}
          className="h-10 w-10"
          aria-label="Configurações"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};