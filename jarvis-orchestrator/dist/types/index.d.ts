export interface OrchestrationRequest {
    query: string;
    context?: TaskContext;
    preferences?: UserPreferences;
}
export interface OrchestrationResponse {
    requestId: string;
    status: 'success' | 'partial' | 'failed';
    results: AgentResult[];
    metadata: {
        nlpAnalysis: NLPAnalysis;
        routingDecision: {
            strategy: string;
            confidence: number;
            selectedAgents: Array<{
                type: string;
                priority: number;
                reasoning: string;
            }>;
        };
        processingTime: number;
        timestamp: string;
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
export interface UserPreferences {
    preferredAgents?: string[];
    excludedAgents?: string[];
    maxProcessingTime?: number;
    responseFormat?: 'detailed' | 'summary' | 'minimal';
}
export interface NLPAnalysis {
    intent: QueryIntent;
    entities: EntityExtraction[];
    complexity: 'low' | 'medium' | 'high';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    confidence: number;
    language: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    keywords: string[];
    timestamp: string;
}
export interface QueryIntent {
    category: 'recruitment' | 'crm' | 'content_generation' | 'project_management' | 'treasury_control' | 'general';
    action: string;
    confidence: number;
    subcategory: string;
}
export interface EntityExtraction {
    type: 'email' | 'phone' | 'date' | 'currency' | 'person' | 'organization' | 'location';
    value: string;
    confidence: number;
    startIndex: number;
    endIndex: number;
}
export interface RoutingDecision {
    strategy: 'single' | 'parallel' | 'sequential' | 'hybrid';
    selectedAgents: AgentSelection[];
    confidence: number;
    reasoning: string;
    fallbackAgents: AgentSelection[];
    estimatedProcessingTime: number;
    timestamp: string;
}
export interface AgentSelection {
    type: string;
    priority: number;
    reasoning: string;
    capabilities: string[];
    maturityLevel: 'M1' | 'M2' | 'M3' | 'M4' | 'M5';
    estimatedProcessingTime: number;
}
export interface AgentResult {
    agentType: string;
    success: boolean;
    data: any;
    error: AgentError | null;
    metadata: {
        priority: number;
        capabilities: string[];
        maturityLevel: string;
        timestamp: string;
        aiModel?: string;
        tokensUsed?: number;
    };
    processingTime: number;
}
export interface AgentError {
    code: string;
    message: string;
    details?: any;
}
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
    result: any;
    error?: AgentError;
    metadata: {
        aiModel: string;
        tokensUsed: number;
        processingTime: number;
        timestamp: string;
    };
}
//# sourceMappingURL=index.d.ts.map