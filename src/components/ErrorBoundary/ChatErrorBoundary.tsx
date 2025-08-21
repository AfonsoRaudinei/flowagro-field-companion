import React, { Component, ReactNode } from 'react';
import { RefreshCw, MessageCircle, AlertCircle } from 'lucide-react';
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
  retryCount: number;
}

class ChatErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('Chat error boundary caught error', { 
      error: error.message, 
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount
    });

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({ 
        hasError: false, 
        error: undefined,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center h-full p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-lg">Erro no Chat</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Ocorreu um erro ao carregar as conversas. Tente novamente ou recarregue a página.
              </p>
              
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
                  {this.state.retryCount >= this.maxRetries ? 'Recarregar' : 'Tentar Novamente'}
                </Button>
                
                <Button
                  onClick={() => window.location.href = '/dashboard'}
                  className="flex-1"
                  variant="default"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </div>
              
              {this.state.retryCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Tentativas: {this.state.retryCount}/{this.maxRetries}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChatErrorBoundary;