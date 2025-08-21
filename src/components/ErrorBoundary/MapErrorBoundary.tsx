import React, { Component, ReactNode } from 'react';
import { MapPin, RefreshCw, AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorType?: 'load' | 'render' | 'api' | 'unknown';
}

class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Categorize error types
    let errorType: State['errorType'] = 'unknown';
    
    if (error.message.includes('MapTiler') || error.message.includes('API')) {
      errorType = 'api';
    } else if (error.message.includes('load') || error.message.includes('fetch')) {
      errorType = 'load';
    } else if (error.message.includes('render')) {
      errorType = 'render';
    }

    return { hasError: true, error, errorType };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('Map error boundary caught error', { 
      error: error.message, 
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorType: this.state.errorType
    });

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorType: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  getErrorMessage = () => {
    switch (this.state.errorType) {
      case 'api':
        return 'Erro ao carregar dados do mapa. Verifique sua conexão com a internet.';
      case 'load':
        return 'Falha ao carregar o mapa. Tente recarregar a página.';
      case 'render':
        return 'Erro de renderização do mapa. Atualize a página.';
      default:
        return 'Erro inesperado no mapa. Tente novamente.';
    }
  };

  getSuggestions = () => {
    switch (this.state.errorType) {
      case 'api':
        return [
          'Verifique sua conexão com a internet',
          'Tente novamente em alguns momentos',
          'Contate o suporte se o problema persistir'
        ];
      case 'load':
        return [
          'Recarregue a página',
          'Limpe o cache do navegador',
          'Tente em uma nova aba'
        ];
      default:
        return [
          'Recarregue a página',
          'Tente novamente',
          'Contate o suporte técnico'
        ];
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center h-full p-4 bg-muted/20">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <CardTitle className="text-lg">Erro no Mapa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm text-center">
                {this.getErrorMessage()}
              </p>
              
              <div className="bg-muted/50 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Soluções sugeridas:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {this.getSuggestions().map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {import.meta.env.DEV && this.state.error && (
                <details className="text-left bg-muted p-2 rounded text-xs">
                  <summary className="cursor-pointer mb-2">Detalhes do erro (dev)</summary>
                  <code className="whitespace-pre-wrap">
                    {this.state.error.message}
                  </code>
                </details>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                  variant="default"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Recarregar Mapa
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;