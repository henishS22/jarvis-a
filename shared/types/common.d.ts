export interface BaseRequest {
    requestId: string;
    timestamp: string;
}
export interface BaseResponse {
    success: boolean;
    timestamp: string;
    requestId?: string;
}
export interface ServiceHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    service: string;
    version: string;
    timestamp: string;
    details?: Record<string, any>;
}
export interface ErrorResponse {
    error: {
        code: string;
        message: string;
        details?: any;
    };
    timestamp: string;
    requestId?: string;
}
export interface ServiceToServiceRequest extends BaseRequest {
    source: 'jarvis-orchestrator' | 'ai-agent-processor';
    destination: 'jarvis-orchestrator' | 'ai-agent-processor';
    payload: any;
}
export interface ServiceToServiceResponse extends BaseResponse {
    data: any;
    metadata?: Record<string, any>;
}
export interface ValidationRule {
    field: string;
    rules: string[];
    message: string;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}
export interface PerformanceMetrics {
    operationName: string;
    duration: number;
    startTime: number;
    endTime: number;
    success: boolean;
    metadata?: Record<string, any>;
}
export interface LogEntry {
    level: 'error' | 'warn' | 'info' | 'debug';
    message: string;
    service: string;
    timestamp: string;
    requestId?: string;
    metadata?: Record<string, any>;
}
export interface ServiceConfig {
    name: string;
    version: string;
    port: number;
    host: string;
    environment: 'development' | 'staging' | 'production';
    logLevel: 'error' | 'warn' | 'info' | 'debug';
}
export interface APIEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
    requestSchema?: any;
    responseSchema?: any;
}
export interface RateLimit {
    windowMs: number;
    maxRequests: number;
    message: string;
}
export interface SecurityConfig {
    apiKeyRequired: boolean;
    allowedOrigins: string[];
    rateLimiting: RateLimit;
    requestSizeLimit: string;
}
//# sourceMappingURL=common.d.ts.map