import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseRetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onError?: (error: Error, attempt: number) => void;
  onSuccess?: () => void;
}

export default function useRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: UseRetryOptions = {}
) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onError,
    onSuccess
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const executeWithRetry = useCallback(async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        setIsRetrying(attempt > 0);
        setRetryCount(attempt);
        
        const result = await fn(...args);
        
        if (attempt > 0) {
          onSuccess?.();
          toast({
            title: "Sucesso",
            description: `Operação realizada após ${attempt} tentativa${attempt > 1 ? 's' : ''}`,
          });
        }
        
        setIsRetrying(false);
        setRetryCount(0);
        return result;
        
      } catch (error) {
        attempt++;
        onError?.(error as Error, attempt);
        
        if (attempt > maxRetries) {
          setIsRetrying(false);
          setRetryCount(0);
          
          toast({
            title: "Erro",
            description: `Falha após ${maxRetries} tentativas. Tente novamente mais tarde.`,
            variant: "destructive",
          });
          
          throw error;
        }
        
        // Exponential backoff with jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
          maxDelay
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Max retries exceeded');
  }, [fn, maxRetries, baseDelay, maxDelay, onError, onSuccess]);

  const reset = useCallback(() => {
    setIsRetrying(false);
    setRetryCount(0);
  }, []);

  return {
    executeWithRetry,
    isRetrying,
    retryCount,
    reset
  };
}