"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentSelector = void 0;
const logger_1 = require("../utils/logger");
class AgentSelector {
    async selectAIService(agentType, query, capabilities) {
        try {
            logger_1.logger.info('Selecting AI service', { agentType, capabilities, queryLength: query.length });
            const openaiAvailable = !!process.env.OPENAI_API_KEY;
            const anthropicAvailable = !!process.env.ANTHROPIC_API_KEY;
            if (!openaiAvailable && !anthropicAvailable) {
                throw new Error('No AI service API keys configured');
            }
            const selection = this.getServicePreference(agentType, query, capabilities, {
                openaiAvailable,
                anthropicAvailable
            });
            logger_1.logger.info('AI service selected', {
                agentType,
                selectedService: selection.service,
                selectedModel: selection.model,
                reasoning: selection.reasoning
            });
            return selection;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error('AI service selection failed', { agentType, error: errorMessage });
            throw new Error(`AI service selection failed: ${errorMessage}`);
        }
    }
    getServicePreference(agentType, query, capabilities, availability) {
        const queryLength = query.length;
        const isComplexQuery = queryLength > 1000 || query.split(' ').length > 200;
        const hasFinancialContent = this.detectFinancialContent(query);
        const hasCreativeContent = this.detectCreativeContent(query);
        const hasAnalyticalContent = this.detectAnalyticalContent(query);
        const selectionRules = [
            {
                condition: agentType === 'treasury_agent' || hasFinancialContent,
                service: 'openai',
                model: 'gpt-4o',
                reasoning: 'OpenAI excels at financial analysis and structured data processing',
                confidence: 0.85
            },
            {
                condition: agentType === 'content_agent' || hasCreativeContent,
                service: 'anthropic',
                model: 'claude-sonnet-4-20250514',
                reasoning: 'Anthropic excels at creative content generation and writing tasks',
                confidence: 0.80
            },
            {
                condition: agentType === 'project_agent' || (hasAnalyticalContent && isComplexQuery),
                service: 'anthropic',
                model: 'claude-sonnet-4-20250514',
                reasoning: 'Anthropic provides superior reasoning for complex analytical tasks',
                confidence: 0.75
            },
            {
                condition: agentType === 'recruitment_agent',
                service: 'openai',
                model: 'gpt-4o',
                reasoning: 'OpenAI provides excellent structured analysis for recruitment tasks',
                confidence: 0.70
            },
            {
                condition: agentType === 'crm_agent',
                service: 'openai',
                model: 'gpt-4o',
                reasoning: 'OpenAI handles customer data analysis and lead scoring effectively',
                confidence: 0.65
            },
            {
                condition: agentType === 'general_assistant',
                service: 'anthropic',
                model: 'claude-sonnet-4-20250514',
                reasoning: 'Anthropic provides balanced performance for general assistance tasks',
                confidence: 0.60
            }
        ];
        for (const rule of selectionRules) {
            if (rule.condition && availability[`${rule.service}Available`]) {
                return {
                    service: rule.service,
                    model: rule.model,
                    reasoning: rule.reasoning,
                    confidence: rule.confidence
                };
            }
        }
        if (availability.openaiAvailable) {
            return {
                service: 'openai',
                model: 'gpt-4o',
                reasoning: 'Fallback to OpenAI as primary available service',
                confidence: 0.50
            };
        }
        if (availability.anthropicAvailable) {
            return {
                service: 'anthropic',
                model: 'claude-sonnet-4-20250514',
                reasoning: 'Fallback to Anthropic as only available service',
                confidence: 0.50
            };
        }
        throw new Error('No AI services available');
    }
    detectFinancialContent(query) {
        const financialKeywords = [
            'payment', 'invoice', 'budget', 'cost', 'price', 'financial', 'money',
            'revenue', 'profit', 'expense', 'transaction', 'billing', 'accounting',
            'treasury', 'cash', 'flow', 'investment', 'tax', 'compliance'
        ];
        const queryLower = query.toLowerCase();
        return financialKeywords.some(keyword => queryLower.includes(keyword));
    }
    detectCreativeContent(query) {
        const creativeKeywords = [
            'write', 'create', 'generate', 'content', 'blog', 'article', 'story',
            'marketing', 'copy', 'description', 'creative', 'draft', 'compose',
            'email', 'letter', 'proposal', 'presentation', 'script', 'narrative'
        ];
        const queryLower = query.toLowerCase();
        return creativeKeywords.some(keyword => queryLower.includes(keyword));
    }
    detectAnalyticalContent(query) {
        const analyticalKeywords = [
            'analyze', 'analysis', 'compare', 'evaluate', 'assess', 'review',
            'research', 'investigate', 'examine', 'study', 'breakdown', 'insights',
            'trends', 'patterns', 'metrics', 'data', 'statistics', 'report'
        ];
        const queryLower = query.toLowerCase();
        return analyticalKeywords.some(keyword => queryLower.includes(keyword));
    }
    getAgentCapabilities(agentType) {
        const capabilityMap = {
            recruitment_agent: [
                'resume_processing',
                'candidate_scoring',
                'interview_scheduling',
                'skills_assessment',
                'job_matching'
            ],
            crm_agent: [
                'lead_management',
                'sales_optimization',
                'customer_insights',
                'lead_scoring',
                'pipeline_management'
            ],
            content_agent: [
                'text_generation',
                'content_optimization',
                'multi_language',
                'seo_optimization',
                'creative_writing'
            ],
            project_agent: [
                'task_scheduling',
                'resource_allocation',
                'progress_tracking',
                'risk_assessment',
                'project_planning'
            ],
            treasury_agent: [
                'payment_processing',
                'financial_analysis',
                'compliance_check',
                'budget_planning',
                'cost_analysis'
            ],
            general_assistant: [
                'general_query_processing',
                'basic_nlp',
                'error_handling',
                'information_retrieval',
                'basic_analysis'
            ]
        };
        return capabilityMap[agentType] || capabilityMap.general_assistant;
    }
    isAgentTypeSupported(agentType) {
        const supportedTypes = [
            'recruitment_agent',
            'crm_agent',
            'content_agent',
            'project_agent',
            'treasury_agent',
            'general_assistant'
        ];
        return supportedTypes.includes(agentType);
    }
}
exports.AgentSelector = AgentSelector;
//# sourceMappingURL=agentSelector.js.map