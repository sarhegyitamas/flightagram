/**
 * Structured Logging Module
 * Provides consistent logging format for all backend operations.
 * Outputs JSON in production for better log aggregation.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLogLevel(): LogLevel {
  const env = process.env.LOG_LEVEL?.toLowerCase();
  if (env && env in LOG_LEVELS) {
    return env as LogLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[getMinLogLevel()];
}

function formatError(error: unknown): LogEntry['error'] | undefined {
  if (!error) return undefined;

  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      code: (error as Error & { code?: string }).code,
    };
  }

  return {
    message: String(error),
  };
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: context && Object.keys(context).length > 0 ? context : undefined,
    error: formatError(error),
  };
}

function output(entry: LogEntry): void {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // JSON format for production (better for log aggregation)
    console.log(JSON.stringify(entry));
  } else {
    // Human-readable format for development
    const { timestamp, level, message, context, error } = entry;
    const levelColor = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m', // green
      warn: '\x1b[33m', // yellow
      error: '\x1b[31m', // red
    };
    const reset = '\x1b[0m';

    let output = `${timestamp} ${levelColor[level]}[${level.toUpperCase()}]${reset} ${message}`;

    if (context) {
      output += ` ${JSON.stringify(context)}`;
    }

    if (error) {
      output += `\n  Error: ${error.message}`;
      if (error.stack) {
        output += `\n  ${error.stack}`;
      }
    }

    console.log(output);
  }
}

/**
 * Main logger object with methods for each log level
 */
export const logger = {
  debug(message: string, context?: LogContext): void {
    if (shouldLog('debug')) {
      output(createLogEntry('debug', message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    if (shouldLog('info')) {
      output(createLogEntry('info', message, context));
    }
  },

  warn(message: string, context?: LogContext, error?: unknown): void {
    if (shouldLog('warn')) {
      output(createLogEntry('warn', message, context, error));
    }
  },

  error(message: string, context?: LogContext, error?: unknown): void {
    if (shouldLog('error')) {
      output(createLogEntry('error', message, context, error));
    }
  },
};

/**
 * Create a child logger with preset context
 */
export function createLogger(baseContext: LogContext) {
  return {
    debug(message: string, context?: LogContext): void {
      logger.debug(message, { ...baseContext, ...context });
    },

    info(message: string, context?: LogContext): void {
      logger.info(message, { ...baseContext, ...context });
    },

    warn(message: string, context?: LogContext, error?: unknown): void {
      logger.warn(message, { ...baseContext, ...context }, error);
    },

    error(message: string, context?: LogContext, error?: unknown): void {
      logger.error(message, { ...baseContext, ...context }, error);
    },
  };
}

// Pre-configured loggers for specific modules
export const schedulerLogger = createLogger({ module: 'scheduler' });
export const webhookLogger = createLogger({ module: 'webhook' });
export const telegramLogger = createLogger({ module: 'telegram' });
export const aeroDataBoxLogger = createLogger({ module: 'aerodatabox' });
export const messageLogger = createLogger({ module: 'message' });
