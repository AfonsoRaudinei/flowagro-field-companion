import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  eventType: string;
  details?: Record<string, any>;
  userAgent?: string;
  timestamp?: Date;
}

export interface SuspiciousActivity {
  userId?: string;
  eventType: string;
  count: number;
  timeWindow: number;
}

export class SecurityService {
  /**
   * Log de eventos de segurança
   */
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_security_event', {
        p_event_type: event.eventType,
        p_details: event.details || {}
      });

      if (error) {
        console.error('Falha ao registrar evento de segurança:', error);
      }
    } catch (error) {
      console.error('Erro ao registrar evento de segurança:', error);
    }
  }

  /**
   * Verificar atividade suspeita
   */
  static async checkSuspiciousActivity(minutes: number = 15): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('check_suspicious_activity', {
        p_minutes: minutes
      });

      if (error) {
        console.error('Falha ao verificar atividade suspeita:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Erro ao verificar atividade suspeita:', error);
      return 0;
    }
  }

  /**
   * Rate limiting básico - armazenar tentativas em localStorage
   */
  static checkRateLimit(action: string, maxAttempts: number = 5, windowMs: number = 900000): boolean {
    const key = `rate_limit_${action}`;
    const now = Date.now();
    
    try {
      const stored = localStorage.getItem(key);
      let attempts: number[] = stored ? JSON.parse(stored) : [];
      
      // Filtrar tentativas dentro da janela de tempo
      attempts = attempts.filter(timestamp => now - timestamp < windowMs);
      
      if (attempts.length >= maxAttempts) {
        return false; // Rate limit excedido
      }
      
      // Adicionar tentativa atual
      attempts.push(now);
      localStorage.setItem(key, JSON.stringify(attempts));
      
      return true;
    } catch (error) {
      console.error('Erro ao verificar rate limit:', error);
      return true; // Em caso de erro, permitir
    }
  }

  /**
   * Validar se o usuário está autenticado
   */
  static async validateAuthentication(): Promise<boolean> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        await this.logSecurityEvent({
          eventType: 'unauthorized_access_attempt',
          details: { error: error?.message }
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao validar autenticação:', error);
      return false;
    }
  }

  /**
   * Sanitizar dados de entrada
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  /**
   * Detectar tentativas de XSS
   */
  static detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Verificar origem da requisição
   */
  static validateOrigin(origin: string): boolean {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://your-domain.com' // Substitua pelo seu domínio
    ];
    
    return allowedOrigins.includes(origin);
  }

  /**
   * Gerar token CSRF básico
   */
  static generateCSRFToken(): string {
    const token = btoa(crypto.getRandomValues(new Uint8Array(32)).toString());
    sessionStorage.setItem('csrf_token', token);
    return token;
  }

  /**
   * Validar token CSRF
   */
  static validateCSRFToken(token: string): boolean {
    const storedToken = sessionStorage.getItem('csrf_token');
    return storedToken === token;
  }

  /**
   * Limpar dados sensíveis do localStorage/sessionStorage
   */
  static clearSensitiveData(): void {
    const sensitiveKeys = [
      'firebase_auth_token',
      'user_credentials',
      'api_keys',
      'csrf_token'
    ];
    
    sensitiveKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  /**
   * Monitorar mudanças suspeitas no DOM
   */
  static initializeDOMMonitoring(): void {
    if (typeof window === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Detectar scripts maliciosos adicionados
            if (element.tagName === 'SCRIPT' && element.getAttribute('src')) {
              const src = element.getAttribute('src')!;
              if (!this.validateOrigin(new URL(src, window.location.origin).origin)) {
                this.logSecurityEvent({
                  eventType: 'suspicious_script_injection',
                  details: { src, userAgent: navigator.userAgent }
                });
                element.remove();
              }
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}