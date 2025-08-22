type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  stack?: string;
}

class StructuredLogger {
  private isDev = import.meta.env.DEV;
  private sessionId = this.generateSessionId();
  private correlationId = this.generateCorrelationId();
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private flushInterval = 30000; // 30 seconds
  private intervalId?: NodeJS.Timeout;

  constructor() {
    if (typeof window !== 'undefined') {
      this.startAutoFlush();
      this.setupErrorHandling();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  private setupErrorHandling() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.error('Unhandled error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });
  }

  private startAutoFlush() {
    this.intervalId = setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      correlationId: this.correlationId,
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    };

    // Add stack trace for errors
    if (level === 'error' || level === 'critical') {
      entry.stack = new Error().stack;
    }

    return entry;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const entry = this.formatMessage(level, message, context);
    
    // Store in memory
    this.logs.push(entry);
    
    // Maintain log buffer size
    if (this.logs.length > this.maxLogs) {
      this.logs.splice(0, this.logs.length - this.maxLogs);
    }

    // Console output in development
    if (this.isDev) {
      const consoleMethod = level === 'critical' ? 'error' : level;
      const contextStr = context ? JSON.stringify(context, null, 2) : '';
      
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, contextStr ? `\n${contextStr}` : '');
    }

    // Immediate flush for critical errors
    if (level === 'critical') {
      this.flushLogs(true);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  critical(message: string, context?: LogContext): void {
    this.log('critical', message, context);
  }

  // Specialized logging methods
  performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`Performance: ${operation}`, {
      ...context,
      duration,
      operation,
      type: 'performance'
    });
  }

  userAction(action: string, component: string, context?: LogContext): void {
    this.info(`User action: ${action}`, {
      ...context,
      action,
      component,
      type: 'user_action'
    });
  }

  apiCall(method: string, url: string, status: number, duration: number, context?: LogContext): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this.log(level, `API ${method} ${url}`, {
      ...context,
      method,
      url,
      status,
      duration,
      type: 'api_call'
    });
  }

  businessLogic(event: string, context?: LogContext): void {
    this.info(`Business logic: ${event}`, {
      ...context,
      event,
      type: 'business_logic'
    });
  }

  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext): void {
    const level = severity === 'critical' ? 'critical' : 
                  severity === 'high' ? 'error' :
                  severity === 'medium' ? 'warn' : 'info';
    
    this.log(level, `Security: ${event}`, {
      ...context,
      event,
      severity,
      type: 'security'
    });
  }

  // Search and filter logs
  getLogs(filter?: {
    level?: LogLevel;
    since?: Date;
    contains?: string;
    type?: string;
  }): LogEntry[] {
    let filtered = [...this.logs];

    if (filter?.level) {
      filtered = filtered.filter(log => log.level === filter.level);
    }

    if (filter?.since) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= filter.since!);
    }

    if (filter?.contains) {
      const search = filter.contains.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(search) ||
        JSON.stringify(log.context || {}).toLowerCase().includes(search)
      );
    }

    if (filter?.type) {
      filtered = filtered.filter(log => log.context?.type === filter.type);
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Export logs for debugging
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'message', 'correlationId', 'sessionId', 'url'];
      const csvRows = [
        headers.join(','),
        ...this.logs.map(log => [
          log.timestamp,
          log.level,
          `"${log.message.replace(/"/g, '""')}"`,
          log.correlationId,
          log.sessionId,
          log.url
        ].join(','))
      ];
      return csvRows.join('\n');
    }

    return JSON.stringify(this.logs, null, 2);
  }

  // Get log statistics
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<LogLevel, number>,
      byType: {} as Record<string, number>,
      recentErrors: 0,
      sessionId: this.sessionId,
      timeRange: {
        oldest: this.logs[0]?.timestamp,
        newest: this.logs[this.logs.length - 1]?.timestamp
      }
    };

    // Count by level
    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      const type = log.context?.type || 'general';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Count recent errors (last 5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if ((log.level === 'error' || log.level === 'critical') && 
          new Date(log.timestamp).getTime() > fiveMinutesAgo) {
        stats.recentErrors++;
      }
    });

    return stats;
  }

  private flushLogs(immediate = false) {
    if (!immediate && this.isDev) {
      return; // Don't flush in development unless immediate
    }

    const logsToFlush = this.logs.filter(log => 
      log.level === 'error' || 
      log.level === 'critical' || 
      log.context?.type === 'performance' ||
      log.context?.type === 'security'
    );

    if (logsToFlush.length > 0) {
      // In production, send to logging service
      console.log('Would flush logs to service:', logsToFlush.length);
      
      // Example: send to external service
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   body: JSON.stringify(logsToFlush)
      // });
    }
  }

  // Set correlation ID for request tracing
  setCorrelationId(id: string) {
    this.correlationId = id;
  }

  // Set user context
  setUserContext(userId: string) {
    this.logs.forEach(log => {
      if (!log.userId) {
        log.userId = userId;
      }
    });
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

export const logger = new StructuredLogger();