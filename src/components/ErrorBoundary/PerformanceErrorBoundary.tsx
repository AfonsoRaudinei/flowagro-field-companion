import React, { Component, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { MemoryMonitor, PerformanceMonitor } from '@/lib/unifiedPerformance';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorBoundary?: string;
}

class PerformanceErrorBoundary extends Component<Props, State> {
  private performanceObserver?: PerformanceObserver;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
    
    // Monitor performance in development
    if (import.meta.env.DEV) {
      this.setupPerformanceMonitoring();
    }
  }

  private setupPerformanceMonitoring() {
    // Monitor long tasks and memory leaks
    if ('PerformanceObserver' in window) {
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

    // Log memory usage periodically
    setInterval(() => {
      MemoryMonitor.logMemoryUsage('ErrorBoundary');
    }, 30000); // Every 30 seconds
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('Error boundary caught error', { 
      error: error.message, 
      stack: error.stack,
      componentStack: errorInfo.componentStack 
    });

    // Log performance metrics when error occurs
    MemoryMonitor.logMemoryUsage('Error');
    
    this.props.onError?.(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }

  handleRetry = () => {
    PerformanceMonitor.start('error-boundary-retry');
    this.setState({ hasError: false, error: undefined });
    PerformanceMonitor.end('error-boundary-retry');
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md p-6 bg-card rounded-lg shadow-lg border">
            <h2 className="text-xl font-semibold text-destructive mb-4">
              Oops! Algo deu errado
            </h2>
            <p className="text-muted-foreground mb-4">
              Ocorreu um erro inesperado. Você pode tentar novamente ou recarregar a página.
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
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
              >
                Tentar Novamente
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/90 transition-colors"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PerformanceErrorBoundary;