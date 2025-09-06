import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  MessageCircle, 
  MapPin, 
  Home,
  AlertCircle,
  Activity 
} from 'lucide-react';
import { logger } from '@/lib/logger';
import { MemoryMonitor, PerformanceMonitor } from '@/lib/unifiedPerformance';
import { cn } from '@/lib/utils';

// Error boundary types
type ErrorBoundaryVariant = 'standard' | 'chat' | 'map' | 'performance' | 'minimal';

interface BaseErrorBoundaryProps {
  children: ReactNode;
  variant?: ErrorBoundaryVariant;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  className?: string;
}

// Specific variant props
interface StandardErrorProps extends BaseErrorBoundaryProps {
  variant?: 'standard';
  showReload?: boolean;
}

interface ChatErrorProps extends BaseErrorBoundaryProps {
  variant: 'chat';
  maxRetries?: number;
  dashboardFallback?: boolean;
}

interface MapErrorProps extends BaseErrorBoundaryProps {
  variant: 'map';
  isLoading?: boolean;
  loadingMessage?: string;
}

interface PerformanceErrorProps extends BaseErrorBoundaryProps {
  variant: 'performance';
  enableMonitoring?: boolean;
  memoryMonitoring?: boolean;
}

interface MinimalErrorProps extends BaseErrorBoundaryProps {
  variant: 'minimal';
  retryText?: string;
}

type UnifiedErrorBoundaryProps = 
  | StandardErrorProps 
  | ChatErrorProps 
  | MapErrorProps 
  | PerformanceErrorProps 
  | MinimalErrorProps;

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  isLoading?: boolean;
}

export class UnifiedErrorBoundary extends Component<UnifiedErrorBoundaryProps, State> {
  private performanceObserver?: PerformanceObserver;
  private memoryInterval?: number;
  
  constructor(props: UnifiedErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      retryCount: 0,
      isLoading: props.variant === 'map' ? props.isLoading : false
    };
    
    // Setup performance monitoring for performance variant
    if (props.variant === 'performance' && props.enableMonitoring !== false) {
      this.setupPerformanceMonitoring();
    }
  }

  private setupPerformanceMonitoring() {
    if (import.meta.env.DEV && 'PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'longtask' && entry.duration > 50) {
              logger.warn('Long task detected', { 
                duration: entry.duration,
                startTime: entry.startTime 
              });
            }
          });
        });
        
        this.performanceObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        logger.warn('Performance monitoring not available', { error });
      }
    }

    // Memory monitoring
    if (this.props.variant === 'performance' && this.props.memoryMonitoring !== false) {
      this.memoryInterval = window.setInterval(() => {
        MemoryMonitor.logMemoryUsage('UnifiedErrorBoundary');
      }, 30000);
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const variant = this.props.variant || 'standard';
    
    logger.error(`${variant} error boundary caught error`, { 
      error: error.message, 
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      variant,
      retryCount: this.state.retryCount
    });

    // Performance logging for performance variant
    if (variant === 'performance') {
      MemoryMonitor.logMemoryUsage('Error');
    }

    this.props.onError?.(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    if (this.memoryInterval) {
      window.clearInterval(this.memoryInterval);
    }
  }

  handleRetry = () => {
    const variant = this.props.variant || 'standard';
    let maxRetries = 5; // default
    
    if (variant === 'chat' && 'maxRetries' in this.props) {
      maxRetries = this.props.maxRetries || 3;
    }
    
    if (variant === 'performance') {
      PerformanceMonitor.start('error-boundary-retry');
    }
    
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({ 
        hasError: false, 
        error: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      window.location.reload();
    }
    
    if (variant === 'performance') {
      PerformanceMonitor.end('error-boundary-retry');
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  renderStandardError() {
    const { showReload = true } = this.props as StandardErrorProps;
    
    return (
      <Card className={cn("p-6 m-4 border-destructive/20", this.props.className)}>
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Algo deu errado
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Ocorreu um erro inesperado. Tente novamente ou recarregue a página.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={this.handleRetry}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </Button>
            {showReload && (
              <Button 
                onClick={this.handleReload}
                size="sm"
              >
                Recarregar Página
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  renderChatError() {
    const variant = this.props.variant;
    const maxRetries = variant === 'chat' && 'maxRetries' in this.props ? this.props.maxRetries || 3 : 3;
    const dashboardFallback = variant === 'chat' && 'dashboardFallback' in this.props ? this.props.dashboardFallback !== false : true;
    
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
                {this.state.retryCount >= maxRetries ? 'Recarregar' : 'Tentar Novamente'}
              </Button>
              
              {dashboardFallback && (
                <Button
                  onClick={this.handleGoHome}
                  className="flex-1"
                  variant="default"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              )}
            </div>
            
            {this.state.retryCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Tentativas: {this.state.retryCount}/{maxRetries}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  renderMapError() {
    const { loadingMessage = "Carregando mapa..." } = this.props as MapErrorProps;
    
    // Loading state
    if (this.state.isLoading && !this.state.hasError) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-muted/50 rounded-lg animate-pulse">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary animate-bounce" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{loadingMessage}</p>
              <p className="text-xs text-muted-foreground">Obtendo configurações do servidor</p>
            </div>
          </div>
        </div>
      );
    }
    
    // Error state
    return (
      <div className="flex items-center justify-center w-full h-full p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar o mapa</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p className="text-sm">{this.state.error?.message || 'Erro desconhecido'}</p>
            <div className="flex gap-2">
              <Button 
                onClick={this.handleRetry} 
                size="sm" 
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-3 h-3" />
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

  renderPerformanceError() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md p-6 bg-card rounded-lg shadow-lg border">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
              <Activity className="w-5 h-5 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-destructive">
              Erro de Performance
            </h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Ocorreu um erro crítico no sistema. Dados de performance foram coletados para análise.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <details className="mb-4 p-2 bg-muted rounded text-sm">
              <summary className="cursor-pointer">Detalhes do erro (dev)</summary>
              <pre className="mt-2 text-xs overflow-auto">
                {this.state.error.message}
              </pre>
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
            >
              Recarregar Página
            </Button>
          </div>
        </div>
      </div>
    );
  }

  renderMinimalError() {
    const { retryText = "Tentar novamente" } = this.props as MinimalErrorProps;
    
    return (
      <div className={cn("flex items-center justify-center p-4", this.props.className)}>
        <div className="text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">Erro ao carregar conteúdo</p>
          <Button onClick={this.handleRetry} size="sm" variant="outline">
            <RefreshCw className="w-3 h-3 mr-2" />
            {retryText}
          </Button>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      switch (this.props.variant) {
        case 'chat':
          return this.renderChatError();
        case 'map':
          return this.renderMapError();
        case 'performance':
          return this.renderPerformanceError();
        case 'minimal':
          return this.renderMinimalError();
        case 'standard':
        default:
          return this.renderStandardError();
      }
    }

    return this.props.children;
  }
}

// Legacy component exports for backward compatibility
export const ErrorBoundary: React.FC<StandardErrorProps> = (props) => (
  <UnifiedErrorBoundary {...props} variant="standard" />
);

export const ChatErrorBoundary: React.FC<Omit<ChatErrorProps, 'variant'>> = (props) => (
  <UnifiedErrorBoundary {...props} variant="chat" />
);

export const MapErrorBoundary: React.FC<Omit<MapErrorProps, 'variant'> & { error?: string; onRetry?: () => void }> = ({ error, onRetry, children, ...props }) => {
  if (error) {
    return (
      <UnifiedErrorBoundary variant="map" {...props}>
        <div>{/* This will trigger error state */}</div>
      </UnifiedErrorBoundary>
    );
  }
  return <>{children}</>;
};

export const PerformanceErrorBoundary: React.FC<Omit<PerformanceErrorProps, 'variant'>> = (props) => (
  <UnifiedErrorBoundary {...props} variant="performance" />
);

export default UnifiedErrorBoundary;