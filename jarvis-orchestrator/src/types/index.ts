// Core request/response types
export interface OrchestrationRequest {
  query: string;
  context?: TaskContext;
  preferences?: UserPreferences;
  modelPreference?: 'auto' | 'claude-sonnet-4' | 'chatgpt-4o';
  sessionId?: string;
  userId?: string;
}

export interface OrchestrationResponse {
  requestId: string;
  status: 'success' | 'partial' | 'failed';
  results: AgentResult[];
  metadata: {
    nlpAnalysis: NLPAnalysis;
    processingTime: number;
    timestamp: string;
    sessionId?: string;
    userId?: string;
    agentCount?: number;
  };
}

// Task context and user preferences
export interface TaskContext {
  userId?: string;
  sessionId?: string;
  source?: 'web' | 'mobile' | 'api' | 'voice';
  metadata?: Record<string, any>;
  conversationHistory?: any[];
}

export interface UserPreferences {
  preferredAgents?: string[];
  excludedAgents?: string[];
  maxProcessingTime?: number;
  modelPreference?: 'auto' | 'claude-sonnet-4' | 'chatgpt-4o';
  responseFormat?: 'detailed' | 'summary' | 'minimal';
}

// Simplified NLP Analysis - only intent detection for routing
export interface NLPAnalysis {
  intent: QueryIntent;
  timestamp: string;
}

export interface QueryIntent {
  category: 'recruitment' | 'content_generation';
  action: string;
}

// Agent routing and selection types
export interface RoutingDecision {
  strategy: 'single' | 'parallel';
  selectedAgents: AgentSelection[];
  reasoning: string;
  fallbackAgents: AgentSelection[];
  timestamp: string;
}

export interface AgentSelection {
  type: string;
  reasoning: string;
  capabilities: string[];
}

// Agent result types
export interface AgentResult {
  agentType: string;
  success: boolean;
  data: any;
  error: AgentError | null;
  metadata: {
    capabilities: string[];
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

// Service communication types
export interface AgentProcessingRequest {
  agentType: string;
  query: string;
  context?: TaskContext;
  capabilities: string[];
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
