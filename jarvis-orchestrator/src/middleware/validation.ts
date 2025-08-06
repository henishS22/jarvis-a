import Joi from 'joi';
import { OrchestrationRequest } from '../types';

const orchestrationRequestSchema = Joi.object({
  query: Joi.string().min(1).max(5000).required().messages({
    'string.empty': 'Query cannot be empty',
    'string.min': 'Query must be at least 1 character',
    'string.max': 'Query cannot exceed 5000 characters',
    'any.required': 'Query is required'
  }),
  
  context: Joi.object({
    userId: Joi.string().optional(),
    sessionId: Joi.string().optional(),
    source: Joi.string().valid('web', 'mobile', 'api', 'voice').optional(),
    language: Joi.string().valid('en', 'fr').optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    metadata: Joi.object().optional()
  }).optional(),
  
  preferences: Joi.object({
    preferredAgents: Joi.array().items(Joi.string()).optional(),
    excludedAgents: Joi.array().items(Joi.string()).optional(),
    maxProcessingTime: Joi.number().min(1000).max(300000).optional(),
    responseFormat: Joi.string().valid('detailed', 'summary', 'minimal').optional()
  }).optional()
});

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: OrchestrationRequest;
}

export function validateOrchestrationRequest(data: any): ValidationResult {
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

// Additional validation helpers
export function validateAgentType(agentType: string): boolean {
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

export function validatePriority(priority: string): boolean {
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  return validPriorities.includes(priority);
}

export function validateLanguage(language: string): boolean {
  const validLanguages = ['en', 'fr'];
  return validLanguages.includes(language);
}
