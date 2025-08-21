type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDev = import.meta.env.DEV;

  private formatMessage(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.isDev) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${level.toUpperCase()}]`;
    
    if (context && Object.keys(context).length > 0) {
      console[level](`${prefix} ${message}`, context);
    } else {
      console[level](`${prefix} ${message}`);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.formatMessage('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.formatMessage('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.formatMessage('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.formatMessage('error', message, context);
  }
}

export const logger = new Logger();