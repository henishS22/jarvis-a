// Working database storage implementation for JARVIS
import { logger } from '../utils/logger';
import { sqlExecutor } from './sql-executor';

// Database storage service that actually stores data
export class DatabaseStorage {
  

  // Store user message
  async storeUserMessage(sessionId: string, userId: string, message: string): Promise<void> {
    try {
      // First ensure session exists
      await this.ensureSession(sessionId, userId, message);
      
      // Store the message in database
      const success = await sqlExecutor.storeUserMessage(sessionId, userId, message);
      
      logger.info('STORE_USER_MESSAGE', {
        sessionId,
        userId,
        message: message.substring(0, 100),
        messageLength: message.length,
        timestamp: new Date().toISOString(),
        service: 'jarvis-orchestrator'
      });

    } catch (error) {
      logger.error('Failed to store user message', { error: error instanceof Error ? error.message : String(error), sessionId, userId });
    }
  }

  // Store AI response
  async storeAIResponse(sessionId: string, userId: string, response: string, metadata: any): Promise<void> {
    try {
      const success = await sqlExecutor.storeAIResponse(sessionId, userId, response, metadata);
      
      logger.info('STORE_AI_RESPONSE', {
        sessionId,
        userId,
        response: response.substring(0, 100),
        responseLength: response.length,
        metadata,
        timestamp: new Date().toISOString(),
        service: 'jarvis-orchestrator'
      });

    } catch (error) {
      logger.error('Failed to store AI response', { error: error instanceof Error ? error.message : String(error), sessionId, userId });
    }
  }

  // Ensure session exists
  async ensureSession(sessionId: string, userId: string, firstMessage?: string): Promise<void> {
    try {
      // Auto-generate title from first message
      let title = null;
      if (firstMessage) {
        title = firstMessage.length > 50 ? firstMessage.substring(0, 50) + '...' : firstMessage;
      }

      const success = await sqlExecutor.ensureSession(sessionId, userId, title || undefined);

      logger.info('ENSURE_SESSION', {
        sessionId,
        userId,
        title,
        timestamp: new Date().toISOString(),
        service: 'jarvis-orchestrator'
      });

    } catch (error) {
      logger.error('Failed to ensure session', { error: error instanceof Error ? error.message : String(error), sessionId, userId });
    }
  }

  // Store performance metrics
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
      const success = await sqlExecutor.storePerformanceMetrics(metrics);
      
      logger.info('STORE_PERFORMANCE_METRICS', {
        ...metrics,
        timestamp: new Date().toISOString(),
        service: 'jarvis-orchestrator'
      });

    } catch (error) {
      logger.error('Failed to store performance metrics', { error: error instanceof Error ? error.message : String(error), requestId: metrics.requestId });
    }
  }
}

// Export singleton
export const databaseStorage = new DatabaseStorage();