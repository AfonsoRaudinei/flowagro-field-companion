import { useEffect, useCallback } from 'react';
import { SecurityService } from '@/lib/securityService';
import { useToast } from '@/hooks/use-toast';

export function useSecurityMonitoring() {
  const { toast } = useToast();

  const logSecurityEvent = useCallback(async (eventType: string, details?: Record<string, any>) => {
    await SecurityService.logSecurityEvent({
      eventType,
      details,
      userAgent: navigator.userAgent,
      timestamp: new Date()
    });
  }, []);

  const checkRateLimit = useCallback((action: string, maxAttempts: number = 5) => {
    const allowed = SecurityService.checkRateLimit(action, maxAttempts, 900000); // 15 minutos
    
    if (!allowed) {
      toast({
        title: "Muitas tentativas",
        description: "Aguarde alguns minutos antes de tentar novamente",
        variant: "destructive"
      });
      
      logSecurityEvent('rate_limit_exceeded', { action, maxAttempts });
    }
    
    return allowed;
  }, [toast, logSecurityEvent]);

  const validateInput = useCallback((input: string, fieldName: string) => {
    if (SecurityService.detectXSS(input)) {
      toast({
        title: "Entrada inválida",
        description: "Conteúdo potencialmente perigoso detectado",
        variant: "destructive"
      });
      
      logSecurityEvent('xss_attempt_detected', { 
        fieldName, 
        inputLength: input.length 
      });
      
      return false;
    }
    
    return true;
  }, [toast, logSecurityEvent]);

  const checkSuspiciousActivity = useCallback(async () => {
    const suspiciousCount = await SecurityService.checkSuspiciousActivity(15);
    
    if (suspiciousCount > 5) {
      toast({
        title: "Atividade suspeita detectada",
        description: "Sua conta será monitorada por segurança",
        variant: "destructive"
      });
      
      await logSecurityEvent('suspicious_activity_alert', { 
        failedAttempts: suspiciousCount 
      });
    }
    
    return suspiciousCount;
  }, [toast, logSecurityEvent]);

  // Inicializar monitoramento de segurança
  useEffect(() => {
    // Monitoramento DOM
    SecurityService.initializeDOMMonitoring();

    // Log de inicialização
    logSecurityEvent('security_monitoring_initialized', {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    // Limpeza ao desmontar
    return () => {
      SecurityService.clearSensitiveData();
    };
  }, [logSecurityEvent]);

  // Verificar atividade suspeita periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      checkSuspiciousActivity();
    }, 300000); // A cada 5 minutos

    return () => clearInterval(interval);
  }, [checkSuspiciousActivity]);

  return {
    logSecurityEvent,
    checkRateLimit,
    validateInput,
    checkSuspiciousActivity
  };
}