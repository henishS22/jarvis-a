"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processWithAgent = processWithAgent;
const agentSelector_1 = require("../services/agentSelector");
const openaiService = __importStar(require("../services/openaiService"));
const anthropicService = __importStar(require("../services/anthropicService"));
const logger_1 = require("../utils/logger");
const validation_1 = require("../middleware/validation");
function getModelPreferenceOverride(modelPreference) {
    switch (modelPreference) {
        case 'claude-sonnet-4':
            return {
                service: 'anthropic',
                model: 'claude-sonnet-4-20250514',
                reasoning: 'User selected Claude Sonnet 4'
            };
        case 'chatgpt-4o':
            return {
                service: 'openai',
                model: 'gpt-4o',
                reasoning: 'User selected ChatGPT 4.0'
            };
        default:
            throw new Error(`Unsupported model preference: ${modelPreference}`);
    }
}
async function processWithAgent(req, res) {
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
        let serviceSelection;
        if (agentRequest.modelPreference && agentRequest.modelPreference !== 'auto') {
            serviceSelection = getModelPreferenceOverride(agentRequest.modelPreference);
            logger_1.logger.info('Using user-specified model preference', {
                requestId,
                modelPreference: agentRequest.modelPreference,
                service: serviceSelection.service,
                model: serviceSelection.model
            });
        }
        else {
            serviceSelection = await (0, agentSelector_1.selectAIService)(agentRequest.agentType, agentRequest.query, agentRequest.capabilities);
        }
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
            const openaiResult = await openaiService.processQuery(agentRequest.query, agentRequest.agentType, agentRequest.capabilities, agentRequest.context, serviceSelection.model);
            result = openaiResult.result;
            aiModel = serviceSelection.model;
            tokensUsed = openaiResult.tokensUsed;
        }
        else {
            const anthropicResult = await anthropicService.processQuery(agentRequest.query, agentRequest.agentType, agentRequest.capabilities, agentRequest.context, serviceSelection.model);
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
                    reasoning: serviceSelection.reasoning
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
}
//# sourceMappingURL=agentController.js.map