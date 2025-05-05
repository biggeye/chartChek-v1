type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  level: LogLevel;
  metadata?: Record<string, unknown>;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = 'info';

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLevel(level: LogLevel) {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, metadata?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...metadata
    });
  }

  debug(message: string, metadata?: Record<string, unknown>) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, metadata));
    }
  }

  info(message: string, metadata?: Record<string, unknown>) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, metadata));
    }
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, metadata));
    }
  }

  error(message: string, error?: unknown, metadata?: Record<string, unknown>) {
    if (this.shouldLog('error')) {
      const errorMetadata = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...metadata
      } : metadata;
      
      console.error(this.formatMessage('error', message, errorMetadata));
    }
  }
}

export const logger = Logger.getInstance(); 