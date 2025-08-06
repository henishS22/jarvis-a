"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOrchestrationRequest = validateOrchestrationRequest;
exports.validateAgentType = validateAgentType;
exports.validatePriority = validatePriority;
exports.validateLanguage = validateLanguage;
const joi_1 = __importDefault(require("joi"));
const orchestrationRequestSchema = joi_1.default.object({
    query: joi_1.default.string().min(1).max(5000).required().messages({
        'string.empty': 'Query cannot be empty',
        'string.min': 'Query must be at least 1 character',
        'string.max': 'Query cannot exceed 5000 characters',
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
    preferences: joi_1.default.object({
        preferredAgents: joi_1.default.array().items(joi_1.default.string()).optional(),
        excludedAgents: joi_1.default.array().items(joi_1.default.string()).optional(),
        maxProcessingTime: joi_1.default.number().min(1000).max(300000).optional(),
        responseFormat: joi_1.default.string().valid('detailed', 'summary', 'minimal').optional()
    }).optional()
});
function validateOrchestrationRequest(data) {
    const { error, value } = orchestrationRequestSchema.validate(data, {
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
function validateAgentType(agentType) {
    const validAgentTypes = [
        'recruitment_agent',
        'crm_agent',
        'content_agent',
        'project_agent',
        'treasury_agent',
        'general_assistant'
    ];
    return validAgentTypes.includes(agentType);
}
function validatePriority(priority) {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    return validPriorities.includes(priority);
}
function validateLanguage(language) {
    const validLanguages = ['en', 'fr'];
    return validLanguages.includes(language);
}
//# sourceMappingURL=validation.js.map