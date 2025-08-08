// Agent processing request/response types
export interface AgentProcessingRequest {
  agentType: string;
  query: string;
  context?: TaskContext;
  capabilities: string[];
  requestId: string;
  modelPreference?: 'auto' | 'claude-sonnet-4' | 'chatgpt-4o';
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

// Task context
export interface TaskContext {
  userId?: string;
  sessionId?: string;
  source?: 'web' | 'mobile' | 'api' | 'voice';
  metadata?: Record<string, any>;
}

// Error types
export interface AgentError {
  code: string;
  message: string;
  details?: any;
}

// AI service types
export interface AIServiceResult {
  result: any;
  tokensUsed: number;
}

export interface ServiceAvailability {
  openaiAvailable: boolean;
  anthropicAvailable: boolean;
}

// Agent capability mapping
export interface AgentCapability {
  name: string;
  description: string;
  supportedBy: ('openai' | 'anthropic')[];
}

// Service selection types
export interface ServiceSelection {
  service: 'openai' | 'anthropic';
  model: string;
  reasoning: string;
}

// Agent type definitions - simplified to two-agent system
export type AgentType = 
  | 'recruitment_agent'
  | 'content_agent';

// Source types
export type Source = 'web' | 'mobile' | 'api' | 'voice';
