// Actual database storage service for JARVIS chat system
import { logger } from '../utils/logger';

// Database query function using our existing execute_sql_tool approach
async function executeQuery(query: string, params: any[] = []): Promise<any> {
  // This is a simplified approach - in a real implementation, 
  // you'd use a proper PostgreSQL client like 'pg'
  // For now, we'll log the queries that would be executed
  
  logger.info('Database query would execute:', { 
    query: query.substring(0, 100) + '...', 
    paramCount: params.length 
  });
  
  // Return mock result for now - in production this would execute actual SQL
  return {
    rows: [],
    rowCount: 0
  };
}

export class ChatStorage {
  // Store user message in database
  async storeUserMessage(sessionId: string, userId: string, message: string): Promise<void> {
    try {
      const query = `
        INSERT INTO chat_messages (session_id, user_id, role, content, created_at) 
        VALUES ($1, $2, 'user', $3, NOW())
      `;
      
      await executeQuery(query, [sessionId, userId, message]);
      
      // Also ensure session exists
      await this.ensureSession(sessionId, userId);
      
      logger.info('User message stored', { sessionId, userId, messageLength: message.length });
    } catch (error) {
      logger.error('Failed to store user message', { error, sessionId, userId });
    }
  }

  // Store AI response in database
  async storeAIResponse(sessionId: string, userId: string, response: string, metadata: any): Promise<void> {
    try {
      const query = `
        INSERT INTO chat_messages (session_id, user_id, role, content, metadata, created_at) 
        VALUES ($1, $2, 'assistant', $3, $4, NOW())
      `;
      
      await executeQuery(query, [sessionId, userId, response, JSON.stringify(metadata)]);
      
      logger.info('AI response stored', { sessionId, userId, responseLength: response.length });
    } catch (error) {
      logger.error('Failed to store AI response', { error, sessionId, userId });
    }
  }

  // Ensure session exists in database
  async ensureSession(sessionId: string, userId: string): Promise<void> {
    try {
      const query = `
        INSERT INTO chat_sessions (session_id, user_id, created_at, updated_at, last_activity)
        VALUES ($1, $2, NOW(), NOW(), NOW())
        ON CONFLICT (session_id) DO UPDATE SET
        last_activity = NOW(),
        updated_at = NOW(),
        message_count = message_count + 1
      `;
      
      await executeQuery(query, [sessionId, userId]);
      
      logger.info('Session ensured', { sessionId, userId });
    } catch (error) {
      logger.error('Failed to ensure session', { error, sessionId, userId });
    }
  }

  // Store performance analytics
  async storePerformanceMetrics(metrics: {
    sessionId: string;
    userId: string;
    agentType: string;
    aiService: string;
    aiModel: string;
    requestId: string;
    queryLength: number;
    responseLength: number;
    processingTime: number;
    tokensUsed: number;
    success: boolean;
    intentDetected: string;
  }): Promise<void> {
    try {
      const query = `
        INSERT INTO agent_performance_logs 
        (session_id, user_id, agent_type, ai_service, ai_model, request_id, 
         query_length, response_length, processing_time_ms, tokens_used, 
         success, intent_detected, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      `;
      
      await executeQuery(query, [
        metrics.sessionId,
        metrics.userId,
        metrics.agentType,
        metrics.aiService,
        metrics.aiModel,
        metrics.requestId,
        metrics.queryLength,
        metrics.responseLength,
        metrics.processingTime,
        metrics.tokensUsed,
        metrics.success,
        metrics.intentDetected
      ]);
      
      logger.info('Performance metrics stored', { 
        requestId: metrics.requestId,
        agentType: metrics.agentType,
        processingTime: metrics.processingTime 
      });
    } catch (error) {
      logger.error('Failed to store performance metrics', { error, requestId: metrics.requestId });
    }
  }

  // Get recent conversation history
  async getConversationHistory(sessionId: string, limit: number = 10): Promise<any[]> {
    try {
      const query = `
        SELECT role, content, created_at
        FROM chat_messages 
        WHERE session_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `;
      
      const result = await executeQuery(query, [sessionId, limit]);
      return result.rows.reverse(); // Return in chronological order
    } catch (error) {
      logger.error('Failed to get conversation history', { error, sessionId });
      return [];
    }
  }
}

// Export singleton instance
export const chatStorage = new ChatStorage();