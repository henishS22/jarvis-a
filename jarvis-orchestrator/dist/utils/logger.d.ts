import winston from 'winston';
export declare const logger: winston.Logger;
export declare function logPerformance(operation: string, startTime: number, metadata?: any): void;
export declare function logRequest(method: string, path: string, statusCode: number, duration: number, metadata?: any): void;
export declare function logError(error: Error, context?: any): void;
export default logger;
//# sourceMappingURL=logger.d.ts.map