// Performance Analytics System for JARVIS Agent Optimization
import { DatabaseConnection } from './db-connection';
import { AgentPerformanceLog, PerformanceStats } from './database';

export interface PerformanceMetrics {
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
  errorType?: string;
  intentDetected: string;
}

// Performance Analytics for AI Agent Optimization
export class PerformanceAnalytics {
  // Log agent performance metrics for analysis
  async logAgentPerformance(metrics: PerformanceMetrics): Promise<void> {
    const query = `
      INSERT INTO agent_performance_logs 
      (session_id, user_id, agent_type, ai_service, ai_model, request_id, 
       query_length, response_length, processing_time_ms, tokens_used, 
       success, error_type, intent_detected, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
    `;
    
    await DatabaseConnection.query(query, [
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
      metrics.errorType,
      metrics.intentDetected
    ]);
  }

  // Get performance statistics for agent optimization
  async getAgentPerformanceStats(
    agentType: string, 
    days: number = 7
  ): Promise<PerformanceStats[]> {
    const query = `
      SELECT 
        ai_service,
        ai_model,
        COUNT(*) as total_requests,
        AVG(processing_time_ms) as avg_processing_time,
        AVG(tokens_used) as avg_tokens,
        SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time_ms) as p95_processing_time
      FROM agent_performance_logs 
      WHERE agent_type = $1 
      AND created_at >= NOW() - INTERVAL '$2 days'
      GROUP BY ai_service, ai_model
      ORDER BY avg_processing_time ASC
    `;
    
    const result = await DatabaseConnection.query(query, [agentType, days]);
    return result.rows;
  }

  // Get overall system performance metrics
  async getSystemPerformanceOverview(days: number = 7): Promise<any> {
    const query = `
      SELECT 
        agent_type,
        COUNT(*) as total_requests,
        AVG(processing_time_ms) as avg_processing_time,
        SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate,
        AVG(tokens_used) as avg_tokens_per_request
      FROM agent_performance_logs 
      WHERE created_at >= NOW() - INTERVAL '$1 days'
      GROUP BY agent_type
      ORDER BY total_requests DESC
    `;
    
    const result = await DatabaseConnection.query(query, [days]);
    return result.rows;
  }

  // Get error analysis for debugging
  async getErrorAnalysis(agentType?: string, days: number = 7): Promise<any> {
    let query = `
      SELECT 
        agent_type,
        error_type,
        COUNT(*) as error_count,
        AVG(processing_time_ms) as avg_processing_time_on_error
      FROM agent_performance_logs 
      WHERE success = false 
      AND created_at >= NOW() - INTERVAL '$1 days'
    `;
    
    const params = [days];
    
    if (agentType) {
      query += ' AND agent_type = $2';
      params.push(agentType);
    }
    
    query += ' GROUP BY agent_type, error_type ORDER BY error_count DESC';
    
    const result = await DatabaseConnection.query(query, params);
    return result.rows;
  }

  // Get performance trends over time
  async getPerformanceTrends(
    agentType: string, 
    days: number = 30
  ): Promise<any> {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as requests_count,
        AVG(processing_time_ms) as avg_processing_time,
        SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate
      FROM agent_performance_logs 
      WHERE agent_type = $1 
      AND created_at >= NOW() - INTERVAL '$2 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    const result = await DatabaseConnection.query(query, [agentType, days]);
    return result.rows;
  }

  // Batch log multiple performance metrics (for high throughput)
  async batchLogPerformance(metrics: PerformanceMetrics[]): Promise<void> {
    if (metrics.length === 0) return;

    const values: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const metric of metrics) {
      values.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, ` +
        `$${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, ` +
        `$${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10}, $${paramIndex + 11}, ` +
        `$${paramIndex + 12}, NOW())`
      );
      
      params.push(
        metric.sessionId, metric.userId, metric.agentType, metric.aiService,
        metric.aiModel, metric.requestId, metric.queryLength, metric.responseLength,
        metric.processingTime, metric.tokensUsed, metric.success, metric.errorType,
        metric.intentDetected
      );
      
      paramIndex += 13;
    }

    const query = `
      INSERT INTO agent_performance_logs 
      (session_id, user_id, agent_type, ai_service, ai_model, request_id, 
       query_length, response_length, processing_time_ms, tokens_used, 
       success, error_type, intent_detected, created_at)
      VALUES ${values.join(', ')}
    `;

    await DatabaseConnection.query(query, params);
  }
}