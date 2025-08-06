"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const agentController_1 = require("./controllers/agentController");
const logger_1 = require("./utils/logger");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    logger_1.logger.info(`${req.method} ${req.path}`, {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        requestId: req.get('X-Request-ID'),
        timestamp: new Date().toISOString()
    });
    next();
});
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'ai-agent-processor',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        availableModels: {
            openai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
            anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not_configured'
        }
    });
});
app.get('/api/v1/agents', (req, res) => {
    res.json({
        agents: [
            'recruitment_agent',
            'crm_agent',
            'content_agent',
            'project_agent',
            'treasury_agent',
            'general_assistant'
        ],
        capabilities: {
            recruitment_agent: ['resume_processing', 'candidate_scoring', 'interview_scheduling'],
            crm_agent: ['lead_management', 'sales_optimization', 'customer_insights'],
            content_agent: ['text_generation', 'content_optimization', 'multi_language'],
            project_agent: ['task_scheduling', 'resource_allocation', 'progress_tracking'],
            treasury_agent: ['payment_processing', 'financial_analysis', 'compliance_check'],
            general_assistant: ['general_query_processing', 'basic_nlp', 'error_handling']
        }
    });
});
app.post('/api/v1/process', agentController_1.processWithAgent);
app.use((error, req, res, next) => {
    logger_1.logger.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred during agent processing',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        timestamp: new Date().toISOString()
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.originalUrl} not found`
        },
        timestamp: new Date().toISOString()
    });
});
app.listen(Number(PORT), '0.0.0.0', () => {
    logger_1.logger.info(`AI Agent Processor Service running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=app.js.map