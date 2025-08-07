// Core request/response types
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
      selectedAgents: Array<{
        type: string;
        reasoning: string;
      }>;
    };
    processingTime: number;
    timestamp: string;
  };
}

// Task context and user preferences
export interface TaskContext {
  userId?: string;
  sessionId?: string;
  source?: 'web' | 'mobile' | 'api' | 'voice';
  metadata?: Record<string, any>;
}

export interface UserPreferences {
  preferredAgents?: string[];
  excludedAgents?: string[];
  maxProcessingTime?: number;
  responseFormat?: 'detailed' | 'summary' | 'minimal';
}

// NLP Analysis types - simplified to only include core features
export interface NLPAnalysis {
  intent: QueryIntent;
  entities: EntityExtraction[];
  sentiment: 'positive' | 'neutral' | 'negative';
  timestamp: string;
}

export interface QueryIntent {
  category: 'recruitment' | 'content_generation';
  action: string;
  subcategory: string;
}

export interface EntityExtraction {
  type: 'email' | 'phone' | 'date' | 'currency' | 'person' | 'organization' | 'location';
  value: string;
  startIndex: number;
  endIndex: number;
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
