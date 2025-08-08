import { Request, Response } from 'express';
import { analyzeQuery } from '../services/nlpService';
import { routeTask } from '../services/taskRouter';
import { processWithAgents } from '../services/agentCommunicator';
import { logger } from '../utils/logger';
import { validateOrchestrationRequest } from '../middleware/validation';
import { OrchestrationRequest, OrchestrationResponse, AgentSelection } from '../types';

export async function orchestrate(req: Request, res: Response): Promise<void> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info('Orchestration request received', { requestId, body: req.body });

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

      // Step 1: Analyze user query with NLP
      logger.info('Starting NLP analysis', { requestId });
      const nlpAnalysis = await analyzeQuery(orchestrationRequest.query);
      
      // Step 2: Route task to appropriate agents
      logger.info('Routing task to agents', { requestId, intent: nlpAnalysis.intent });
      const routingDecision = await routeTask(nlpAnalysis, orchestrationRequest.context);

      // Step 3: Communicate with selected agents
      logger.info('Communicating with agents', { 
        requestId, 
        selectedAgents: routingDecision.selectedAgents.map((a: AgentSelection) => a.type) 
      });
      
      const agentResults = await processWithAgents(
        routingDecision.selectedAgents,
        orchestrationRequest,
        requestId
      );

      // Step 4: Aggregate and format response
      const response: OrchestrationResponse = {
        requestId,
        status: 'success',
        results: agentResults,
        metadata: {
          nlpAnalysis,
          processingTime: Date.now() - parseInt(requestId.split('_')[1]),
          timestamp: new Date().toISOString()
        }
      };

      logger.info('Orchestration completed successfully', { 
        requestId, 
        agentCount: agentResults.length,
        processingTime: response.metadata.processingTime 
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
