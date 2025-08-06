"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orchestrate = orchestrate;
const nlpService_1 = require("../services/nlpService");
const taskRouter_1 = require("../services/taskRouter");
const agentCommunicator_1 = require("../services/agentCommunicator");
const logger_1 = require("../utils/logger");
const validation_1 = require("../middleware/validation");
async function orchestrate(req, res) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
        logger_1.logger.info('Orchestration request received', { requestId, body: req.body });
        const validation = (0, validation_1.validateOrchestrationRequest)(req.body);
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
        const orchestrationRequest = req.body;
        logger_1.logger.info('Starting NLP analysis', { requestId });
        const nlpAnalysis = await (0, nlpService_1.analyzeQuery)(orchestrationRequest.query);
        logger_1.logger.info('Routing task to agents', { requestId, intent: nlpAnalysis.intent });
        const routingDecision = await (0, taskRouter_1.routeTask)(nlpAnalysis, orchestrationRequest.context);
        logger_1.logger.info('Communicating with agents', {
            requestId,
            selectedAgents: routingDecision.selectedAgents.map((a) => a.type)
        });
        const agentResults = await (0, agentCommunicator_1.processWithAgents)(routingDecision.selectedAgents, orchestrationRequest, requestId);
        const response = {
            requestId,
            status: 'success',
            results: agentResults,
            metadata: {
                nlpAnalysis,
                routingDecision: {
                    strategy: routingDecision.strategy,
                    confidence: routingDecision.confidence,
                    selectedAgents: routingDecision.selectedAgents.map((a) => ({
                        type: a.type,
                        priority: a.priority,
                        reasoning: a.reasoning
                    }))
                },
                processingTime: Date.now() - parseInt(requestId.split('_')[1]),
                timestamp: new Date().toISOString()
            }
        };
        logger_1.logger.info('Orchestration completed successfully', {
            requestId,
            agentCount: agentResults.length,
            processingTime: response.metadata.processingTime
        });
        res.json(response);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger_1.logger.error('Orchestration failed', { requestId, error: errorMessage, stack: errorStack });
        res.status(500).json({
            error: 'Orchestration Failed',
            message: 'Failed to process orchestration request',
            details: errorMessage,
            requestId,
            timestamp: new Date().toISOString()
        });
    }
}
//# sourceMappingURL=orchestratorController.js.map