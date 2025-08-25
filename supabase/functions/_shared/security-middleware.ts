// Middleware de segurança para Edge Functions
export interface SecurityContext {
  userId?: string;
  userAgent?: string;
  origin?: string;
  ipAddress?: string;
}

export class EdgeSecurityService {
  private static allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://your-domain.com' // Substitua pelo seu domínio
  ];

  /**
   * Verificar CORS e origem
   */
  static validateOrigin(request: Request): boolean {
    const origin = request.headers.get('origin');
    if (!origin) return false;
    
    return this.allowedOrigins.includes(origin);
  }

  /**
   * Rate limiting básico usando Headers
   */
  static checkRateLimit(request: Request, maxRequests: number = 100): boolean {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ip = forwardedFor || realIP || 'unknown';
    
    // Em um ambiente real, você usaria Redis ou similar
    // Por enquanto, apenas log
    console.log(`Rate limit check for IP: ${ip}`);
    
    return true; // Permitir por enquanto
  }

  /**
   * Sanitizar entrada JSON
   */
  static sanitizeJsonInput(data: any): any {
    if (typeof data === 'string') {
      return data
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeJsonInput(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeJsonInput(value);
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * Validar JWT Token (básico)
   */
  static validateJWT(authHeader: string | null): boolean {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verificação básica de formato JWT
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    try {
      // Verificar se as partes são base64 válidas
      atob(parts[0]);
      atob(parts[1]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extrair contexto de segurança da requisição
   */
  static extractSecurityContext(request: Request): SecurityContext {
    return {
      userAgent: request.headers.get('user-agent') || undefined,
      origin: request.headers.get('origin') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || undefined
    };
  }

  /**
   * Middleware principal de segurança
   */
  static securityMiddleware(request: Request): Response | null {
    // Verificar método
    if (!['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'].includes(request.method)) {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { 
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar rate limiting
    if (!this.checkRateLimit(request)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }), 
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Para requisições que não são OPTIONS, verificar origem
    if (request.method !== 'OPTIONS' && !this.validateOrigin(request)) {
      return new Response(
        JSON.stringify({ error: 'Invalid origin' }), 
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return null; // Permitir continuar
  }

  /**
   * Headers CORS seguros
   */
  static getCorsHeaders(origin?: string): HeadersInit {
    const allowedOrigin = origin && this.allowedOrigins.includes(origin) 
      ? origin 
      : this.allowedOrigins[0];

    return {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };
  }

  /**
   * Log de segurança estruturado
   */
  static logSecurityEvent(
    eventType: string, 
    context: SecurityContext, 
    details?: Record<string, any>
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      context,
      details: details || {},
      severity: this.getEventSeverity(eventType)
    };

    // Em produção, enviar para sistema de logging
    console.log('SECURITY_EVENT:', JSON.stringify(logEntry));
  }

  /**
   * Determinar severidade do evento
   */
  private static getEventSeverity(eventType: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalEvents = ['sql_injection_attempt', 'xss_attempt', 'unauthorized_access'];
    const highEvents = ['rate_limit_exceeded', 'invalid_origin', 'suspicious_payload'];
    const mediumEvents = ['failed_authentication', 'invalid_request'];
    
    if (criticalEvents.includes(eventType)) return 'critical';
    if (highEvents.includes(eventType)) return 'high';
    if (mediumEvents.includes(eventType)) return 'medium';
    return 'low';
  }
}