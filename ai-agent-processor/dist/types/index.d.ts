export interface AgentProcessingRequest {
    agentType: string;
    query: string;
    context?: TaskContext;
    capabilities: string[];
    maturityLevel: string;
    requestId: string;
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
            confidence: number;
        };
    };
}
export interface TaskContext {
    userId?: string;
    sessionId?: string;
    source?: 'web' | 'mobile' | 'api' | 'voice';
    language?: 'en' | 'fr';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    metadata?: Record<string, any>;
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
    maturityLevel: 'M1' | 'M2' | 'M3' | 'M4' | 'M5';
    supportedBy: ('openai' | 'anthropic')[];
}
export interface ServiceSelection {
    service: 'openai' | 'anthropic';
    model: string;
    reasoning: string;
    confidence: number;
}
export type AgentType = 'recruitment_agent' | 'crm_agent' | 'content_agent' | 'project_agent' | 'treasury_agent' | 'general_assistant';
export type MaturityLevel = 'M1' | 'M2' | 'M3' | 'M4' | 'M5';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Language = 'en' | 'fr';
export type Source = 'web' | 'mobile' | 'api' | 'voice';
//# sourceMappingURL=index.d.ts.map