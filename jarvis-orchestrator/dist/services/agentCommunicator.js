"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCommunicator = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class AgentCommunicator {
    constructor() {
        this.agentServiceUrl = process.env.AI_AGENT_SERVICE_URL || 'http://localhost:8000';
        this.timeout = parseInt(process.env.AGENT_TIMEOUT || '30000');
    }
    async processWithAgents(selectedAgents, request, requestId) {
        try {
            logger_1.logger.info('Starting agent communication', {
                requestId,
                agentCount: selectedAgents.length,
                agentTypes: selectedAgents.map(a => a.type)
            });
            const results = [];
            const sortedAgents = [...selectedAgents].sort((a, b) => a.priority - b.priority);
            for (const agent of sortedAgents) {
                try {
                    const startTime = Date.now();
                    logger_1.logger.info('Processing with agent', { requestId, agentType: agent.type });
                    const agentResult = await this.callAgent(agent, request, requestId);
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
                            priority: agent.priority,
                            capabilities: agent.capabilities,
                            maturityLevel: agent.maturityLevel,
                            timestamp: new Date().toISOString()
                        },
                        processingTime: 0
                    });
                }
            }
            const successfulResults = results.filter(r => r.success);
            if (successfulResults.length === 0) {
                logger_1.logger.warn('No agents processed successfully', { requestId });
                const fallbackResult = await this.processFallback(request, requestId);
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
    async callAgent(agent, request, requestId) {
        const payload = {
            agentType: agent.type,
            query: request.query,
            context: request.context,
            capabilities: agent.capabilities,
            maturityLevel: agent.maturityLevel,
            requestId
        };
        try {
            const response = await axios_1.default.post(`${this.agentServiceUrl}/api/v1/process`, payload, {
                timeout: this.timeout,
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
                    priority: agent.priority,
                    capabilities: agent.capabilities,
                    maturityLevel: agent.maturityLevel,
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
    async processFallback(request, requestId) {
        try {
            logger_1.logger.info('Attempting fallback processing', { requestId });
            const fallbackAgent = {
                type: 'general_assistant',
                priority: 99,
                reasoning: 'Fallback processing after all agents failed',
                capabilities: ['general_query_processing'],
                maturityLevel: 'M2',
                estimatedProcessingTime: 2000
            };
            return await this.callAgent(fallbackAgent, request, requestId);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error('Fallback processing also failed', { requestId, error: errorMessage });
            return null;
        }
    }
    async checkAgentServiceHealth() {
        try {
            const response = await axios_1.default.get(`${this.agentServiceUrl}/api/v1/health`, {
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
    async getAvailableAgentTypes() {
        try {
            const response = await axios_1.default.get(`${this.agentServiceUrl}/api/v1/agents`, {
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
}
exports.AgentCommunicator = AgentCommunicator;
//# sourceMappingURL=agentCommunicator.js.map