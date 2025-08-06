"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentController = exports.AgentController = void 0;
const agentSelector_1 = require("../services/agentSelector");
const openaiService_1 = require("../services/openaiService");
const anthropicService_1 = require("../services/anthropicService");
const logger_1 = require("../utils/logger");
const validation_1 = require("../middleware/validation");
class AgentController {
    constructor() {
        this.processWithAgent = async (req, res) => {
            const requestId = req.get('X-Request-ID') || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const startTime = Date.now();
            try {
                logger_1.logger.info('Agent processing request received', {
                    requestId,
                    agentType: req.body.agentType,
                    queryLength: req.body.query?.length
                });
                const validation = (0, validation_1.validateAgentRequest)(req.body);
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
                const agentRequest = req.body;
                const serviceSelection = await this.agentSelector.selectAIService(agentRequest.agentType, agentRequest.query, agentRequest.capabilities);
                logger_1.logger.info('AI service selected', {
                    requestId,
                    service: serviceSelection.service,
                    model: serviceSelection.model,
                    reasoning: serviceSelection.reasoning
                });
                let result;
                let aiModel;
                let tokensUsed = 0;
                if (serviceSelection.service === 'openai') {
                    const openaiResult = await this.openaiService.processQuery(agentRequest.query, agentRequest.agentType, agentRequest.capabilities, agentRequest.context, serviceSelection.model);
                    result = openaiResult.result;
                    aiModel = serviceSelection.model;
                    tokensUsed = openaiResult.tokensUsed;
                }
                else {
                    const anthropicResult = await this.anthropicService.processQuery(agentRequest.query, agentRequest.agentType, agentRequest.capabilities, agentRequest.context, serviceSelection.model);
                    result = anthropicResult.result;
                    aiModel = serviceSelection.model;
                    tokensUsed = anthropicResult.tokensUsed;
                }
                const processingTime = Date.now() - startTime;
                const response = {
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
                logger_1.logger.info('Agent processing completed successfully', {
                    requestId,
                    agentType: agentRequest.agentType,
                    aiModel,
                    tokensUsed,
                    processingTime
                });
                res.json(response);
            }
            catch (error) {
                const processingTime = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                const errorStack = error instanceof Error ? error.stack : undefined;
                logger_1.logger.error('Agent processing failed', {
                    requestId,
                    error: errorMessage,
                    stack: errorStack,
                    processingTime
                });
                let statusCode = 500;
                let errorCode = 'PROCESSING_ERROR';
                if (errorMessage.includes('API key')) {
                    statusCode = 401;
                    errorCode = 'AUTHENTICATION_ERROR';
                }
                else if (errorMessage.includes('rate limit')) {
                    statusCode = 429;
                    errorCode = 'RATE_LIMIT_ERROR';
                }
                else if (errorMessage.includes('quota')) {
                    statusCode = 402;
                    errorCode = 'QUOTA_EXCEEDED';
                }
                else if (errorMessage.includes('timeout')) {
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
        };
        this.agentSelector = new agentSelector_1.AgentSelector();
        this.openaiService = new openaiService_1.OpenAIService();
        this.anthropicService = new anthropicService_1.AnthropicService();
    }
}
exports.AgentController = AgentController;
exports.agentController = new AgentController();
//# sourceMappingURL=agentController.js.map