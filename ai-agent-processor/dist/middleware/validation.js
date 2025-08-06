"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAgentRequest = validateAgentRequest;
exports.validateModel = validateModel;
exports.validateCapabilities = validateCapabilities;
exports.validatePriority = validatePriority;
exports.validateLanguage = validateLanguage;
exports.validateMaturityLevel = validateMaturityLevel;
const joi_1 = __importDefault(require("joi"));
const agentProcessingRequestSchema = joi_1.default.object({
    agentType: joi_1.default.string()
        .valid('recruitment_agent', 'crm_agent', 'content_agent', 'project_agent', 'treasury_agent', 'general_assistant')
        .required()
        .messages({
        'any.only': 'Agent type must be one of: recruitment_agent, crm_agent, content_agent, project_agent, treasury_agent, general_assistant',
        'any.required': 'Agent type is required'
    }),
    query: joi_1.default.string().min(1).max(10000).required().messages({
        'string.empty': 'Query cannot be empty',
        'string.min': 'Query must be at least 1 character',
        'string.max': 'Query cannot exceed 10000 characters',
        'any.required': 'Query is required'
    }),
    context: joi_1.default.object({
        userId: joi_1.default.string().optional(),
        sessionId: joi_1.default.string().optional(),
        source: joi_1.default.string().valid('web', 'mobile', 'api', 'voice').optional(),
        language: joi_1.default.string().valid('en', 'fr').optional(),
        priority: joi_1.default.string().valid('low', 'medium', 'high', 'urgent').optional(),
        metadata: joi_1.default.object().optional()
    }).optional(),
    capabilities: joi_1.default.array().items(joi_1.default.string()).optional().default([]),
    maturityLevel: joi_1.default.string().valid('M1', 'M2', 'M3', 'M4', 'M5').optional().default('M2'),
    requestId: joi_1.default.string().required().messages({
        'any.required': 'Request ID is required'
    })
});
function validateAgentRequest(data) {
    const { error, value } = agentProcessingRequestSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return {
            isValid: false,
            errors
        };
    }
    return {
        isValid: true,
        errors: [],
        data: value
    };
}
function validateModel(service, model) {
    const validModels = {
        openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        anthropic: ['claude-sonnet-4-20250514', 'claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022']
    };
    return validModels[service]?.includes(model) || false;
}
function validateCapabilities(agentType, capabilities) {
    const validCapabilities = {
        recruitment_agent: ['resume_processing', 'candidate_scoring', 'interview_scheduling', 'skills_assessment', 'job_matching'],
        crm_agent: ['lead_management', 'sales_optimization', 'customer_insights', 'lead_scoring', 'pipeline_management'],
        content_agent: ['text_generation', 'content_optimization', 'multi_language', 'seo_optimization', 'creative_writing'],
        project_agent: ['task_scheduling', 'resource_allocation', 'progress_tracking', 'risk_assessment', 'project_planning'],
        treasury_agent: ['payment_processing', 'financial_analysis', 'compliance_check', 'budget_planning', 'cost_analysis'],
        general_assistant: ['general_query_processing', 'basic_nlp', 'error_handling', 'information_retrieval', 'basic_analysis']
    };
    const validCaps = validCapabilities[agentType] || [];
    return capabilities.every(cap => validCaps.includes(cap));
}
function validatePriority(priority) {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    return validPriorities.includes(priority);
}
function validateLanguage(language) {
    const validLanguages = ['en', 'fr'];
    return validLanguages.includes(language);
}
function validateMaturityLevel(level) {
    const validLevels = ['M1', 'M2', 'M3', 'M4', 'M5'];
    return validLevels.includes(level);
}
//# sourceMappingURL=validation.js.map