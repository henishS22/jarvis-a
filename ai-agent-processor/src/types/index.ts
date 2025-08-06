// Agent processing request/response types
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

// Task context
export interface TaskContext {
  userId?: string;
  sessionId?: string;
  source?: 'web' | 'mobile' | 'api' | 'voice';
  language?: 'en' | 'fr';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
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
  maturityLevel: 'M1' | 'M2' | 'M3' | 'M4' | 'M5';
  supportedBy: ('openai' | 'anthropic')[];
}

// Service selection types
export interface ServiceSelection {
  service: 'openai' | 'anthropic';
  model: string;
  reasoning: string;
  confidence: number;
}

// Agent type definitions
export type AgentType = 
  | 'recruitment_agent'
  | 'crm_agent'
  | 'content_agent'
  | 'project_agent'
  | 'treasury_agent'
  | 'general_assistant';

// Maturity levels as defined in architecture
export type MaturityLevel = 'M1' | 'M2' | 'M3' | 'M4' | 'M5';

// Priority levels
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// Supported languages
export type Language = 'en' | 'fr';

// Source types
export type Source = 'web' | 'mobile' | 'api' | 'voice';
