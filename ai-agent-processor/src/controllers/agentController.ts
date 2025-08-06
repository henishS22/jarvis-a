import { Request, Response } from 'express';
import { selectAIService } from '../services/agentSelector';
import * as openaiService from '../services/openaiService';
import * as anthropicService from '../services/anthropicService';
import { logger } from '../utils/logger';
import { validateAgentRequest } from '../middleware/validation';
import { AgentProcessingRequest, AgentProcessingResponse } from '../types';

export async function processWithAgent(req: Request, res: Response): Promise<void> {
    const requestId = req.get('X-Request-ID') || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      logger.info('Agent processing request received', { 
        requestId, 
        agentType: req.body.agentType,
        queryLength: req.body.query?.length 
      });

      // Validate request
      const validation = validateAgentRequest(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid agent processing request',
            details: validation.errors
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const agentRequest: AgentProcessingRequest = req.body;

      // Select appropriate AI service and model
      const serviceSelection = await selectAIService(
        agentRequest.agentType,
        agentRequest.query,
        agentRequest.capabilities
      );

      logger.info('AI service selected', {
        requestId,
        service: serviceSelection.service,
        model: serviceSelection.model,
        reasoning: serviceSelection.reasoning
      });

      // Process with selected AI service
      let result: any;
      let aiModel: string;
      let tokensUsed: number = 0;

      if (serviceSelection.service === 'openai') {
        const openaiResult = await openaiService.processQuery(
          agentRequest.query,
          agentRequest.agentType,
          agentRequest.capabilities,
          agentRequest.context,
          serviceSelection.model
        );
        result = openaiResult.result;
        aiModel = serviceSelection.model;
        tokensUsed = openaiResult.tokensUsed;
      } else {
        const anthropicResult = await anthropicService.processQuery(
          agentRequest.query,
          agentRequest.agentType,
          agentRequest.capabilities,
          agentRequest.context,
          serviceSelection.model
        );
        result = anthropicResult.result;
        aiModel = serviceSelection.model;
        tokensUsed = anthropicResult.tokensUsed;
      }

      const processingTime = Date.now() - startTime;

      const response: AgentProcessingResponse = {
        success: true,
        result,
        metadata: {
          aiModel,
          tokensUsed,
          processingTime,
          timestamp: new Date().toISOString(),
          agentType: agentRequest.agentType,
          serviceSelection: {
            service: serviceSelection.service,
            reasoning: serviceSelection.reasoning,
            confidence: serviceSelection.confidence
          }
        }
      };

      logger.info('Agent processing completed successfully', {
        requestId,
        agentType: agentRequest.agentType,
        aiModel,
        tokensUsed,
        processingTime
      });

      res.json(response);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error('Agent processing failed', {
        requestId,
        error: errorMessage,
        stack: errorStack,
        processingTime
      });

      // Determine error type and status code
      let statusCode = 500;
      let errorCode = 'PROCESSING_ERROR';

      if (errorMessage.includes('API key')) {
        statusCode = 401;
        errorCode = 'AUTHENTICATION_ERROR';
      } else if (errorMessage.includes('rate limit')) {
        statusCode = 429;
        errorCode = 'RATE_LIMIT_ERROR';
      } else if (errorMessage.includes('quota')) {
        statusCode = 402;
        errorCode = 'QUOTA_EXCEEDED';
      } else if (errorMessage.includes('timeout')) {
        statusCode = 504;
        errorCode = 'TIMEOUT_ERROR';
      }

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: 'Agent processing failed',
          details: errorMessage
        },
        metadata: {
          processingTime,
          timestamp: new Date().toISOString()
        }
      });
    }
}
