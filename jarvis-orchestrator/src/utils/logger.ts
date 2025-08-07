import winston from 'winston';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      service: 'jarvis-orchestrator',
      message,
      ...meta
    });
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'jarvis-orchestrator',
    version: '1.0.0'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for production logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Performance logging helper
export function logPerformance(operation: string, startTime: number, metadata?: any) {
  const duration = Date.now() - startTime;
  logger.info(`Performance: ${operation}`, {
    operation,
    duration,
    ...metadata
  });
}

// Request logging helper
export function logRequest(method: string, path: string, statusCode: number, duration: number, metadata?: any) {
  logger.info('HTTP Request', {
    method,
    path,
    statusCode,
    duration,
    ...metadata
  });
}

// Error logging helper
export function logError(error: Error, context?: any) {
  logger.error('Error occurred', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context
  });
}

// Create logs directory if it doesn't exist
import * as fs from 'fs';
import * as path from 'path';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export default logger;
