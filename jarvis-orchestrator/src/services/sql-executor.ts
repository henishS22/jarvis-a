// SQL Executor service that uses the actual execute_sql_tool
import { logger } from '../utils/logger';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SqlExecutor {
  
  // Execute SQL directly using the environment's SQL execution capability
  async executeQuery(query: string, params: any[] = []): Promise<any> {
    try {
      // Replace parameters in query
      let finalQuery = query;
      params.forEach((param, index) => {
        const placeholder = `$${index + 1}`;
        let value: string;
        
        if (param === null || param === undefined) {
          value = 'NULL';
        } else if (typeof param === 'string') {
          // Escape single quotes for SQL and wrap in quotes
          value = `'${param.replace(/'/g, "''")}'`;
        } else if (typeof param === 'boolean') {
          value = param ? 'TRUE' : 'FALSE';
        } else if (typeof param === 'object') {
          // For JSON objects
          value = `'${JSON.stringify(param).replace(/'/g, "''")}'`;
        } else {
          value = String(param);
        }
        
        finalQuery = finalQuery.replace(new RegExp(`\\$${index + 1}\\b`, 'g'), value);
      });
      
      logger.info('Executing SQL query', {
        query: finalQuery.substring(0, 200) + (finalQuery.length > 200 ? '...' : ''),
        paramCount: params.length,
        service: 'jarvis-orchestrator'
      });
      
      // Create a temporary SQL file and execute it
      const timestamp = Date.now();
      const tempFile = `/tmp/sql_${timestamp}.sql`;
      
      // Write SQL to temporary file
      await execAsync(`echo "${finalQuery.replace(/"/g, '\\"')}" > ${tempFile}`);
      
      // Execute SQL using psql
      const command = `psql "${process.env.DATABASE_URL}" -f ${tempFile}`;
      
      try {
        const { stdout, stderr } = await execAsync(command);
        
        // Clean up temp file
        await execAsync(`rm -f ${tempFile}`);
        
        logger.info('SQL executed successfully', {
          result: stdout.substring(0, 100),
          service: 'jarvis-orchestrator'
        });
        
        return {
          success: true,
          output: stdout,
          error: stderr
        };
        
      } catch (sqlError) {
        // Clean up temp file
        await execAsync(`rm -f ${tempFile}`);
        
        logger.error('SQL execution failed', {
          error: sqlError instanceof Error ? sqlError.message : String(sqlError),
          service: 'jarvis-orchestrator'
        });
        
        return {
          success: false,
          output: '',
          error: sqlError instanceof Error ? sqlError.message : String(sqlError)
        };
      }
      
    } catch (error) {
      logger.error('SQL preparation failed', {
        error: error instanceof Error ? error.message : String(error),
        service: 'jarvis-orchestrator'
      });
      
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  // Store user message
  async storeUserMessage(sessionId: string, userId: string, message: string): Promise<boolean> {
    const query = `
      INSERT INTO chat_messages (session_id, user_id, role, content, created_at) 
      VALUES (CAST($1 AS UUID), $2, 'user', $3, NOW())
    `;
    
    const result = await this.executeQuery(query, [sessionId, userId, message]);
    return result.success;
  }
  
  // Store AI response
  async storeAIResponse(sessionId: string, userId: string, response: string, metadata: any): Promise<boolean> {
    const query = `
      INSERT INTO chat_messages (session_id, user_id, role, content, metadata, created_at) 
      VALUES (CAST($1 AS UUID), $2, 'assistant', $3, $4, NOW())
    `;
    
    const result = await this.executeQuery(query, [sessionId, userId, response, metadata]);
    return result.success;
  }
  
  // Ensure session exists
  async ensureSession(sessionId: string, userId: string, title?: string): Promise<boolean> {
    const query = `
      INSERT INTO chat_sessions (session_id, user_id, title, created_at, updated_at, last_activity)
      VALUES (CAST($1 AS UUID), $2, $3, NOW(), NOW(), NOW())
      ON CONFLICT (session_id) DO UPDATE SET
      last_activity = NOW(),
      updated_at = NOW(),
      message_count = message_count + 1
    `;
    
    const result = await this.executeQuery(query, [sessionId, userId, title || null]);
    return result.success;
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
  }): Promise<boolean> {
    const query = `
      INSERT INTO agent_performance_logs 
      (session_id, user_id, agent_type, ai_service, ai_model, request_id, 
       query_length, response_length, processing_time_ms, tokens_used, 
       success, intent_detected, created_at)
      VALUES (CAST($1 AS UUID), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
    `;
    
    const result = await this.executeQuery(query, [
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
    
    return result.success;
  }
}

// Export singleton
export const sqlExecutor = new SqlExecutor();