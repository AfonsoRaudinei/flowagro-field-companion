// ⚠️ DEPRECATED: Use UnifiedErrorBoundary from '@/components/errors/UnifiedErrorBoundary' instead
// This file is kept for backward compatibility only

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertCircle, MapPin } from 'lucide-react';

interface MapErrorBoundaryProps {
  error: string | null;
  isLoading: boolean;
  onRetry: () => void;
  children: React.ReactNode;
}

export const MapErrorBoundary: React.FC<MapErrorBoundaryProps> = ({ 
  error, 
  isLoading, 
  onRetry, 
  children 
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-muted/50 rounded-lg animate-pulse">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
            <MapPin className="w-6 h-6 text-primary animate-bounce" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Carregando mapa...</p>
            <p className="text-xs text-muted-foreground">Obtendo configurações do servidor</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar o mapa</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p className="text-sm">{error}</p>
            <div className="flex gap-2">
              <Button 
                onClick={onRetry} 
                size="sm" 
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCcw className="w-3 h-3" />
                Tentar novamente
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Se o problema persistir, verifique sua conexão com a internet.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};