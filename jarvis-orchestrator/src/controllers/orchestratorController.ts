import { Request, Response } from 'express';
import { analyzeQuery } from '../services/nlpService';
import { routeTask } from '../services/taskRouter';
import { processWithAgents } from '../services/agentCommunicator';
import { logger } from '../utils/logger';
import { validateOrchestrationRequest } from '../middleware/validation';
import { OrchestrationRequest, OrchestrationResponse, AgentSelection } from '../types';
import { databaseStorage } from '../services/database-storage';

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
