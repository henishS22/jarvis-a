"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processWithAgents = processWithAgents;
exports.checkAgentServiceHealth = checkAgentServiceHealth;
exports.getAvailableAgentTypes = getAvailableAgentTypes;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const agentServiceUrl = process.env.AI_AGENT_SERVICE_URL || 'http://localhost:8000';
const timeout = parseInt(process.env.AGENT_TIMEOUT || '30000');
async function processWithAgents(selectedAgents, request, requestId) {
    try {
        logger_1.logger.info('Starting agent communication', {
            requestId,
            agentCount: selectedAgents.length,
            agentTypes: selectedAgents.map(a => a.type)
        });
        const results = [];
        const sortedAgents = [...selectedAgents];
        for (const agent of sortedAgents) {
            try {
                const startTime = Date.now();
                logger_1.logger.info('Processing with agent', { requestId, agentType: agent.type });
                const agentResult = await callAgent(agent, request, requestId);
                agentResult.processingTime = Date.now() - startTime;
                results.push(agentResult);
                logger_1.logger.info('Agent processing completed', {
                    requestId,
                    agentType: agent.type,
                    processingTime: agentResult.processingTime,
                    success: agentResult.success
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const errorDetails = error?.response?.data || null;
                logger_1.logger.error('Agent processing failed', {
                    requestId,
                    agentType: agent.type,
                    error: errorMessage
                });
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
                        capabilities: agent.capabilities,
                        timestamp: new Date().toISOString()
                    },
                    processingTime: 0
                });
            }
        }
        const successfulResults = results.filter(r => r.success);
        if (successfulResults.length === 0) {
            logger_1.logger.warn('No agents processed successfully', { requestId });
            const fallbackResult = await processFallback(request, requestId);
            if (fallbackResult) {
                results.push(fallbackResult);
            }
        }
        logger_1.logger.info('Agent communication completed', {
            requestId,
            totalResults: results.length,
            successfulResults: successfulResults.length
        });
        return results;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('Agent communication failed', { requestId, error: errorMessage });
        throw new Error(`Agent communication failed: ${errorMessage}`);
    }
}
async function callAgent(agent, request, requestId) {
    const payload = {
        agentType: agent.type,
        query: request.query,
        context: request.context,
        capabilities: agent.capabilities,
        requestId
    };
    try {
        const response = await axios_1.default.post(`${agentServiceUrl}/api/v1/process`, payload, {
            timeout,
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId,
                'X-Agent-Type': agent.type
            }
        });
        return {
            agentType: agent.type,
            success: true,
            data: response.data.result,
            error: null,
            metadata: {
                capabilities: agent.capabilities,
                timestamp: new Date().toISOString(),
                aiModel: response.data.metadata?.aiModel,
                tokensUsed: response.data.metadata?.tokensUsed
            },
            processingTime: 0
        };
    }
    catch (error) {
        const axiosError = error;
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
async function processFallback(request, requestId) {
    try {
        logger_1.logger.info('Attempting fallback processing', { requestId });
        const fallbackAgent = {
            type: 'content_agent',
            reasoning: 'Fallback processing after all agents failed',
            capabilities: ['general_query_processing']
        };
        return await callAgent(fallbackAgent, request, requestId);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('Fallback processing also failed', { requestId, error: errorMessage });
        return null;
    }
}
async function checkAgentServiceHealth() {
    try {
        const response = await axios_1.default.get(`${agentServiceUrl}/api/v1/health`, {
            timeout: 5000
        });
        return response.status === 200 && response.data.status === 'healthy';
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.warn('Agent service health check failed', { error: errorMessage });
        return false;
    }
}
async function getAvailableAgentTypes() {
    try {
        const response = await axios_1.default.get(`${agentServiceUrl}/api/v1/agents`, {
            timeout: 5000
        });
        return response.data.agents || [];
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.warn('Failed to get available agent types', { error: errorMessage });
        return [];
    }
}
//# sourceMappingURL=agentCommunicator.js.map