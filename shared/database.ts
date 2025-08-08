// Shared database types and utilities for JARVIS Chat History System

export interface ChatSession {
  session_id: string;
  user_id: string;
  title?: string;
  created_at: Date;
  updated_at: Date;
  message_count: number;
  last_activity: Date;
}

export interface ChatMessage {
  message_id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
  created_at: Date;
}

export interface AgentPerformanceLog {
  log_id: string;
  session_id?: string;
  user_id?: string;
  agent_type: string;
  ai_service?: string;
  ai_model?: string;
  request_id?: string;
  query_length?: number;
  response_length?: number;
  processing_time_ms?: number;
  tokens_used?: number;
  success: boolean;
  error_type?: string;
  intent_detected?: string;
  created_at: Date;
}

export interface ConversationContext {
  recentMessages: ChatMessage[];
  sessionSummary?: string;
  totalMessages: number;
  sessionId: string;
  userId: string;
}

export interface PerformanceStats {
  ai_service: string;
  ai_model: string;
  total_requests: number;
  avg_processing_time: number;
  avg_tokens: number;
  success_rate: number;
  p95_processing_time: number;
}

// Enhanced context interface for agent processing
export interface EnhancedContext {
  conversationHistory: ChatMessage[];
  sessionId: string;
  userId: string;
  totalMessages: number;
  sessionSummary?: string;
}

// Request tracking interface
export interface RequestTracker {
  requestId: string;
  sessionId: string;
  userId: string;
  startTime: number;
  agentType?: string;
  intent?: string;
}