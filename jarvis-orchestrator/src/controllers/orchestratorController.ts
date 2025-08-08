import { Request, Response } from 'express';
import { analyzeQuery } from '../services/nlpService';
import { routeTask } from '../services/taskRouter';
import { processWithAgents } from '../services/agentCommunicator';
import { logger } from '../utils/logger';
import { validateOrchestrationRequest } from '../middleware/validation';
import { OrchestrationRequest, OrchestrationResponse, AgentSelection } from '../types';
import { databaseStorage } from '../services/database-storage';
import { sqlExecutor } from '../services/sql-executor';

// Import crypto for UUID generation
import { randomUUID } from 'crypto';

// Session management utilities for guest users
function generateSessionId(): string {
  return randomUUID();
}

function generateGuestUserId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function orchestrate(req: Request, res: Response): Promise<void> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      // Enhanced logging with session tracking
      logger.info('Orchestration request received', { 
        requestId, 
        body: req.body,
        service: 'jarvis-orchestrator',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });

      // Validate request
      const validation = validateOrchestrationRequest(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid request format',
          details: validation.errors,
          requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const orchestrationRequest: OrchestrationRequest = req.body;
      
      // Generate session and user IDs if not provided (guest mode)
      const sessionId = orchestrationRequest.sessionId || orchestrationRequest.context?.sessionId || generateSessionId();
      const userId = orchestrationRequest.userId || orchestrationRequest.context?.userId || generateGuestUserId();
      
      // Store user message in database
      await databaseStorage.storeUserMessage(sessionId, userId, orchestrationRequest.query);
      
      // Log session information for tracking
      logger.info('Processing chat session', { 
        requestId, 
        sessionId, 
        userId, 
        queryLength: orchestrationRequest.query.length,
        service: 'jarvis-orchestrator',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });

      // Step 1: Analyze user query with NLP
      logger.info('Starting NLP analysis', { 
        requestId,
        service: 'jarvis-orchestrator',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
      const nlpAnalysis = await analyzeQuery(orchestrationRequest.query);
      
      // Step 2: Route task to appropriate agents
      logger.info('Routing task to agents', { 
        intent: nlpAnalysis.intent,
        requestId,
        service: 'jarvis-orchestrator',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
      const routingDecision = await routeTask(nlpAnalysis, orchestrationRequest.context);

      // Step 3: Communicate with selected agents
      logger.info('Communicating with agents', { 
        requestId, 
        selectedAgents: routingDecision.selectedAgents.map((a: AgentSelection) => a.type),
        service: 'jarvis-orchestrator',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
      
      // Enhanced orchestration request with session context
      const enhancedRequest = {
        ...orchestrationRequest,
        context: {
          ...orchestrationRequest.context,
          sessionId,
          userId
        },
        sessionId,
        userId
      };
      
      const agentResults = await processWithAgents(
        routingDecision.selectedAgents,
        enhancedRequest,
        requestId
      );

      // Step 4: Aggregate and format response with enhanced metadata
      const processingTime = Date.now() - startTime;
      
      const response: OrchestrationResponse = {
        requestId,
        status: 'success',
        results: agentResults,
        metadata: {
          nlpAnalysis,
          processingTime,
          timestamp: new Date().toISOString(),
          sessionId,
          userId,
          agentCount: agentResults.length
        }
      };

      // Store AI response and performance metrics
      if (agentResults.length > 0) {
        const mainResult = agentResults[0];
        const responseContent = typeof mainResult.data === 'string' ? mainResult.data : JSON.stringify(mainResult.data);
        
        // Store AI response
        await databaseStorage.storeAIResponse(sessionId, userId, responseContent, {
          agentType: mainResult.agentType,
          aiModel: mainResult.metadata?.aiModel,
          processingTime,
          tokensUsed: mainResult.metadata?.tokensUsed
        });
        
        // Store performance metrics
        await databaseStorage.storePerformanceMetrics({
          sessionId,
          userId,
          agentType: mainResult.agentType,
          aiService: mainResult.metadata?.aiModel?.includes('claude') ? 'anthropic' : 'openai',
          aiModel: mainResult.metadata?.aiModel || 'unknown',
          requestId,
          queryLength: orchestrationRequest.query.length,
          responseLength: responseContent.length,
          processingTime,
          tokensUsed: mainResult.metadata?.tokensUsed || 0,
          success: true,
          intentDetected: nlpAnalysis.intent.category || 'unknown'
        });
      }
      
      logger.info('Orchestration completed successfully', { 
        requestId, 
        agentCount: agentResults.length,
        processingTime,
        service: 'jarvis-orchestrator',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });

      res.json(response);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error('Orchestration failed', { requestId, error: errorMessage, stack: errorStack });
      
      res.status(500).json({
        error: 'Orchestration Failed',
        message: 'Failed to process orchestration request',
        details: errorMessage,
        requestId,
        timestamp: new Date().toISOString()
      });
    }
}

// Chat History API Controllers
export async function getChatHistory(req: Request, res: Response): Promise<void> {
    try {
        const { userId } = req.query;
        
        if (!userId || typeof userId !== 'string') {
            res.status(400).json({
                error: 'Bad Request',
                message: 'userId parameter is required',
                timestamp: new Date().toISOString()
            });
            return;
        }

        logger.info('Fetching chat history', { 
            userId, 
            service: 'jarvis-orchestrator',
            timestamp: new Date().toISOString()
        });

        // Query to get chat sessions for the user
        const query = `
            SELECT 
                cs.session_id,
                cs.title,
                cs.created_at,
                cs.updated_at,
                cs.last_activity,
                cs.message_count,
                (
                    SELECT content 
                    FROM chat_messages cm 
                    WHERE cm.session_id = cs.session_id 
                    ORDER BY cm.created_at DESC 
                    LIMIT 1
                ) as last_message
            FROM chat_sessions cs
            WHERE cs.user_id = $1
            ORDER BY cs.last_activity DESC
            LIMIT 50
        `;

        const result = await sqlExecutor.executeQuery(query, [userId]);

        if (result.success) {
            // Parse the output to extract session data
            const sessions = parseSessionsFromOutput(result.output);
            
            res.json({
                sessions,
                userId,
                timestamp: new Date().toISOString()
            });
        } else {
            logger.warn('Failed to fetch chat history', { 
                userId, 
                error: result.error,
                service: 'jarvis-orchestrator'
            });
            
            res.json({
                sessions: [],
                userId,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        logger.error('Error fetching chat history', { 
            error: error instanceof Error ? error.message : String(error),
            service: 'jarvis-orchestrator'
        });
        
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch chat history',
            timestamp: new Date().toISOString()
        });
    }
}

export async function getChatMessages(req: Request, res: Response): Promise<void> {
    try {
        const { sessionId } = req.query;
        
        if (!sessionId || typeof sessionId !== 'string') {
            res.status(400).json({
                error: 'Bad Request',
                message: 'sessionId parameter is required',
                timestamp: new Date().toISOString()
            });
            return;
        }

        logger.info('Fetching chat messages', { 
            sessionId, 
            service: 'jarvis-orchestrator',
            timestamp: new Date().toISOString()
        });

        // Query to get messages for the session
        const query = `
            SELECT 
                message_id,
                session_id,
                user_id,
                role,
                content,
                metadata,
                created_at
            FROM chat_messages
            WHERE session_id = CAST($1 AS UUID)
            ORDER BY created_at ASC
            LIMIT 100
        `;

        const result = await sqlExecutor.executeQuery(query, [sessionId]);

        if (result.success) {
            // Parse the output to extract message data
            const messages = parseMessagesFromOutput(result.output);
            
            res.json({
                messages,
                sessionId,
                timestamp: new Date().toISOString()
            });
        } else {
            logger.warn('Failed to fetch chat messages', { 
                sessionId, 
                error: result.error,
                service: 'jarvis-orchestrator'
            });
            
            res.json({
                messages: [],
                sessionId,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        logger.error('Error fetching chat messages', { 
            error: error instanceof Error ? error.message : String(error),
            service: 'jarvis-orchestrator'
        });
        
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch chat messages',
            timestamp: new Date().toISOString()
        });
    }
}

// Helper functions to parse SQL output
function parseSessionsFromOutput(output: string): any[] {
    try {
        // This is a simplified parser - in production you'd want more robust parsing
        const lines = output.split('\n').filter(line => line.trim() && !line.includes('---') && !line.includes('row'));
        const sessions = [];
        
        for (const line of lines) {
            if (line.includes('|')) {
                const parts = line.split('|').map(part => part.trim());
                if (parts.length >= 6) {
                    sessions.push({
                        session_id: parts[0],
                        title: parts[1] || 'New Conversation',
                        created_at: parts[2],
                        updated_at: parts[3], 
                        last_activity: parts[4],
                        message_count: parseInt(parts[5]) || 0,
                        last_message: parts[6] || ''
                    });
                }
            }
        }
        
        return sessions;
    } catch (error) {
        logger.warn('Failed to parse sessions output', { error: error instanceof Error ? error.message : String(error) });
        return [];
    }
}

function parseMessagesFromOutput(output: string): any[] {
    try {
        // This is a simplified parser - in production you'd want more robust parsing
        const lines = output.split('\n').filter(line => line.trim() && !line.includes('---') && !line.includes('row'));
        const messages = [];
        
        for (const line of lines) {
            if (line.includes('|')) {
                const parts = line.split('|').map(part => part.trim());
                if (parts.length >= 6) {
                    let metadata = null;
                    try {
                        if (parts[5] && parts[5] !== '') {
                            metadata = JSON.parse(parts[5]);
                        }
                    } catch (e) {
                        // Ignore metadata parsing errors
                    }
                    
                    messages.push({
                        message_id: parts[0],
                        session_id: parts[1],
                        user_id: parts[2],
                        role: parts[3],
                        content: parts[4],
                        metadata,
                        created_at: parts[6]
                    });
                }
            }
        }
        
        return messages;
    } catch (error) {
        logger.warn('Failed to parse messages output', { error: error instanceof Error ? error.message : String(error) });
        return [];
    }
}
