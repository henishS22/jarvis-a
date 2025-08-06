import Joi from 'joi';
import { AgentProcessingRequest } from '../types';

const agentProcessingRequestSchema = Joi.object({
  agentType: Joi.string()
    .valid('recruitment_agent', 'crm_agent', 'content_agent', 'project_agent', 'treasury_agent', 'general_assistant')
    .required()
    .messages({
      'any.only': 'Agent type must be one of: recruitment_agent, crm_agent, content_agent, project_agent, treasury_agent, general_assistant',
      'any.required': 'Agent type is required'
    }),

  query: Joi.string().min(1).max(10000).required().messages({
    'string.empty': 'Query cannot be empty',
    'string.min': 'Query must be at least 1 character',
    'string.max': 'Query cannot exceed 10000 characters',
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

  capabilities: Joi.array().items(Joi.string()).optional().default([]),

  maturityLevel: Joi.string().valid('M1', 'M2', 'M3', 'M4', 'M5').optional().default('M2'),

  requestId: Joi.string().required().messages({
    'any.required': 'Request ID is required'
  })
});

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: AgentProcessingRequest;
}

export function validateAgentRequest(data: any): ValidationResult {
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

// Additional validation helpers
export function validateModel(service: 'openai' | 'anthropic', model: string): boolean {
  const validModels = {
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    anthropic: ['claude-sonnet-4-20250514', 'claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022']
  };

  return validModels[service]?.includes(model) || false;
}

export function validateCapabilities(agentType: string, capabilities: string[]): boolean {
  const validCapabilities: Record<string, string[]> = {
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

export function validatePriority(priority: string): boolean {
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  return validPriorities.includes(priority);
}

export function validateLanguage(language: string): boolean {
  const validLanguages = ['en', 'fr'];
  return validLanguages.includes(language);
}

export function validateMaturityLevel(level: string): boolean {
  const validLevels = ['M1', 'M2', 'M3', 'M4', 'M5'];
  return validLevels.includes(level);
}
