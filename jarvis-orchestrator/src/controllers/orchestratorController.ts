import { Request, Response } from 'express';
import { NLPService } from '../services/nlpService';
import { TaskRouter } from '../services/taskRouter';
import { AgentCommunicator } from '../services/agentCommunicator';
import { logger } from '../utils/logger';
import { validateOrchestrationRequest } from '../middleware/validation';
import { OrchestrationRequest, OrchestrationResponse } from '../types';

export class OrchestratorController {
  private nlpService: NLPService;
  private taskRouter: TaskRouter;
  private agentCommunicator: AgentCommunicator;

  constructor() {
    this.nlpService = new NLPService();
    this.taskRouter = new TaskRouter();
    this.agentCommunicator = new AgentCommunicator();
  }

  public orchestrate = async (req: Request, res: Response): Promise<void> => {
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
      const nlpAnalysis = await this.nlpService.analyzeQuery(orchestrationRequest.query);
      
      // Step 2: Route task to appropriate agents
      logger.info('Routing task to agents', { requestId, intent: nlpAnalysis.intent });
      const routingDecision = await this.taskRouter.routeTask(nlpAnalysis, orchestrationRequest.context);

      // Step 3: Communicate with selected agents
      logger.info('Communicating with agents', { 
        requestId, 
        selectedAgents: routingDecision.selectedAgents.map(a => a.type) 
      });
      
      const agentResults = await this.agentCommunicator.processWithAgents(
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
          routingDecision: {
            strategy: routingDecision.strategy,
            confidence: routingDecision.confidence,
            selectedAgents: routingDecision.selectedAgents.map(a => ({
              type: a.type,
              priority: a.priority,
              reasoning: a.reasoning
            }))
          },
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
  };
}

export const orchestratorController = new OrchestratorController();
