export interface AgentProcessingRequest {
    agentType: string;
    query: string;
    context?: TaskContext;
    capabilities: string[];
    requestId: string;
    modelPreference?: 'auto' | 'claude-sonnet-4' | 'chatgpt-4o';
    conversationHistory?: any[];
}
export interface AgentProcessingResponse {
    success: boolean;
    result?: any;
    error?: AgentError;
    metadata: {
        aiModel: string;
        tokensUsed: number;
        processingTime: number;
        timestamp: string;
        agentType?: string;
        serviceSelection?: {
            service: string;
            reasoning: string;
        };
    };
}
export interface TaskContext {
    userId?: string;
    sessionId?: string;
    source?: 'web' | 'mobile' | 'api' | 'voice';
    metadata?: Record<string, any>;
    conversationHistory?: any[];
}
export interface AgentError {
    code: string;
    message: string;
    details?: any;
}
export interface AIServiceResult {
    result: any;
    tokensUsed: number;
}
export interface ServiceAvailability {
    openaiAvailable: boolean;
    anthropicAvailable: boolean;
}
export interface AgentCapability {
    name: string;
    description: string;
    supportedBy: ('openai' | 'anthropic')[];
}
export interface ServiceSelection {
    service: 'openai' | 'anthropic';
    model: string;
    reasoning: string;
}
export type AgentType = 'recruitment_agent' | 'content_agent';
export type Source = 'web' | 'mobile' | 'api' | 'voice';
//# sourceMappingURL=index.d.ts.map