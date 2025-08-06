import axios from 'axios';
import { logger } from '../utils/logger';
import { AgentSelection, OrchestrationRequest, AgentResult } from '../types';

const agentServiceUrl = process.env.AI_AGENT_SERVICE_URL || 'http://localhost:8000';
const timeout = parseInt(process.env.AGENT_TIMEOUT || '30000');

/**
 * Processes requests with selected agents
 */
export async function processWithAgents(
  selectedAgents: AgentSelection[],
  request: OrchestrationRequest,
  requestId: string
): Promise<AgentResult[]> {
  try {
    logger.info('Starting agent communication', {
      requestId,
      agentCount: selectedAgents.length,
      agentTypes: selectedAgents.map(a => a.type)
    });

    const results: AgentResult[] = [];

    // Sort agents by priority
    const sortedAgents = [...selectedAgents].sort((a, b) => a.priority - b.priority);

    // Process agents based on routing strategy
    for (const agent of sortedAgents) {
      try {
        const startTime = Date.now();
        logger.info('Processing with agent', { requestId, agentType: agent.type });

        const agentResult = await callAgent(agent, request, requestId);
        agentResult.processingTime = Date.now() - startTime;

        results.push(agentResult);

        logger.info('Agent processing completed', {
          requestId,
          agentType: agent.type,
          processingTime: agentResult.processingTime,
          success: agentResult.success
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails = (error as any)?.response?.data || null;
        
        logger.error('Agent processing failed', {
          requestId,
          agentType: agent.type,
          error: errorMessage
        });

        // Add failed result with error details
        results.push({
          agentType: agent.type,
          success: false,
          data: null,
          error: {
            code: 'AGENT_PROCESSING_FAILED',
            message: errorMessage,
            details: errorDetails
          },
          metadata: {
            priority: agent.priority,
            capabilities: agent.capabilities,
            maturityLevel: agent.maturityLevel,
            timestamp: new Date().toISOString()
          },
          processingTime: 0
        });
      }
    }

    // Check if we have at least one successful result
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length === 0) {
      logger.warn('No agents processed successfully', { requestId });
      
      // Try fallback processing
      const fallbackResult = await processFallback(request, requestId);
      if (fallbackResult) {
        results.push(fallbackResult);
      }
    }

    logger.info('Agent communication completed', {
      requestId,
      totalResults: results.length,
      successfulResults: successfulResults.length
    });

    return results;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Agent communication failed', { requestId, error: errorMessage });
    throw new Error(`Agent communication failed: ${errorMessage}`);
  }
}

async function callAgent(
  agent: AgentSelection,
  request: OrchestrationRequest,
  requestId: string
): Promise<AgentResult> {
  const payload = {
    agentType: agent.type,
    query: request.query,
    context: request.context,
    capabilities: agent.capabilities,
    maturityLevel: agent.maturityLevel,
    requestId
  };

  try {
    const response = await axios.post(
      `${agentServiceUrl}/api/v1/process`,
      payload,
      {
        timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'X-Agent-Type': agent.type
        }
      }
    );

    return {
      agentType: agent.type,
      success: true,
      data: response.data.result,
      error: null,
      metadata: {
        priority: agent.priority,
        capabilities: agent.capabilities,
        maturityLevel: agent.maturityLevel,
        timestamp: new Date().toISOString(),
        aiModel: response.data.metadata?.aiModel,
        tokensUsed: response.data.metadata?.tokensUsed
      },
      processingTime: 0 // Will be set by caller
    };

  } catch (error) {
    const axiosError = error as any;
    
    if (axiosError.code === 'ECONNREFUSED') {
      throw new Error('Agent service is not available');
    }
    
    if (axiosError.response?.status === 404) {
      throw new Error(`Agent type "${agent.type}" not supported`);
    }
    
    if (axiosError.response?.status >= 500) {
      throw new Error('Agent service internal error');
    }
    
    throw error;
  }
}

async function processFallback(request: OrchestrationRequest, requestId: string): Promise<AgentResult | null> {
  try {
    logger.info('Attempting fallback processing', { requestId });

    const fallbackAgent: AgentSelection = {
      type: 'general_assistant',
      priority: 99,
      reasoning: 'Fallback processing after all agents failed',
      capabilities: ['general_query_processing'],
      maturityLevel: 'M2',
      estimatedProcessingTime: 2000
    };

    return await callAgent(fallbackAgent, request, requestId);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Fallback processing also failed', { requestId, error: errorMessage });
    return null;
  }
}

/**
 * Health check for agent service
 */
export async function checkAgentServiceHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${agentServiceUrl}/api/v1/health`, {
      timeout: 5000
    });
    
    return response.status === 200 && response.data.status === 'healthy';
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn('Agent service health check failed', { error: errorMessage });
    return false;
  }
}

/**
 * Get available agent types from the agent service
 */
export async function getAvailableAgentTypes(): Promise<string[]> {
  try {
    const response = await axios.get(`${agentServiceUrl}/api/v1/agents`, {
      timeout: 5000
    });
    
    return response.data.agents || [];
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn('Failed to get available agent types', { error: errorMessage });
    return []; // Return empty array as fallback
  }
}
