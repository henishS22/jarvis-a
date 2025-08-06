"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRouter = void 0;
const logger_1 = require("../utils/logger");
class TaskRouter {
    async routeTask(nlpAnalysis, context) {
        try {
            logger_1.logger.info('Starting task routing', {
                intent: nlpAnalysis.intent.category,
                complexity: nlpAnalysis.complexity
            });
            const strategy = this.determineRoutingStrategy(nlpAnalysis, context);
            const selectedAgents = await this.selectAgents(nlpAnalysis, strategy, context);
            const confidence = this.calculateRoutingConfidence(nlpAnalysis, selectedAgents);
            const routingDecision = {
                strategy,
                selectedAgents,
                confidence,
                reasoning: this.generateRoutingReasoning(nlpAnalysis, selectedAgents),
                fallbackAgents: this.selectFallbackAgents(selectedAgents),
                estimatedProcessingTime: this.estimateProcessingTime(selectedAgents, nlpAnalysis.complexity),
                timestamp: new Date().toISOString()
            };
            logger_1.logger.info('Task routing completed', {
                strategy: routingDecision.strategy,
                agentCount: selectedAgents.length,
                confidence: confidence
            });
            return routingDecision;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error('Task routing failed', { error: errorMessage });
            throw new Error(`Task routing failed: ${errorMessage}`);
        }
    }
    determineRoutingStrategy(nlpAnalysis, context) {
        const { intent, complexity, priority } = nlpAnalysis;
        if (priority === 'urgent' || priority === 'high') {
            return complexity === 'high' ? 'hybrid' : 'parallel';
        }
        if (complexity === 'high' && this.requiresSequentialProcessing(intent.category)) {
            return 'sequential';
        }
        if (complexity === 'low' && this.isSingleDomainTask(intent.category)) {
            return 'single';
        }
        return 'parallel';
    }
    async selectAgents(nlpAnalysis, strategy, context) {
        const { intent, entities, complexity } = nlpAnalysis;
        const selectedAgents = [];
        const primaryAgent = this.selectPrimaryAgent(intent.category, complexity);
        if (primaryAgent) {
            selectedAgents.push(primaryAgent);
        }
        const secondaryAgents = await this.selectSecondaryAgents(entities, complexity, intent.category);
        selectedAgents.push(...secondaryAgents);
        if (selectedAgents.length === 0) {
            selectedAgents.push({
                type: 'general_assistant',
                priority: 1,
                reasoning: 'Fallback to general assistant for unrecognized intent',
                capabilities: ['general_query_processing', 'basic_nlp'],
                maturityLevel: 'M2',
                estimatedProcessingTime: 3000
            });
        }
        return selectedAgents;
    }
    selectPrimaryAgent(intentCategory, complexity) {
        const agentMap = {
            recruitment: {
                type: 'recruitment_agent',
                capabilities: ['resume_processing', 'candidate_scoring', 'interview_scheduling'],
                maturityLevel: 'M2'
            },
            crm: {
                type: 'crm_agent',
                capabilities: ['lead_management', 'sales_optimization', 'customer_insights'],
                maturityLevel: 'M3'
            },
            content_generation: {
                type: 'content_agent',
                capabilities: ['text_generation', 'content_optimization', 'multi_language'],
                maturityLevel: 'M4'
            },
            project_management: {
                type: 'project_agent',
                capabilities: ['task_scheduling', 'resource_allocation', 'progress_tracking'],
                maturityLevel: 'M2'
            },
            treasury_control: {
                type: 'treasury_agent',
                capabilities: ['payment_processing', 'financial_analysis', 'compliance_check'],
                maturityLevel: 'M3'
            }
        };
        const agentConfig = agentMap[intentCategory];
        if (!agentConfig)
            return null;
        return {
            type: agentConfig.type,
            priority: 1,
            reasoning: `Primary agent for ${intentCategory} tasks`,
            capabilities: agentConfig.capabilities,
            maturityLevel: agentConfig.maturityLevel,
            estimatedProcessingTime: this.getBaseProcessingTime(complexity)
        };
    }
    async selectSecondaryAgents(entities, complexity, primaryIntent) {
        const secondaryAgents = [];
        if (entities.some(e => e.type === 'currency') && primaryIntent !== 'treasury_control') {
            secondaryAgents.push({
                type: 'treasury_agent',
                priority: 2,
                reasoning: 'Financial entities detected in query',
                capabilities: ['payment_processing', 'financial_analysis'],
                maturityLevel: 'M3',
                estimatedProcessingTime: this.getBaseProcessingTime(complexity) * 0.7
            });
        }
        if (entities.some(e => e.type === 'email' || e.type === 'phone') && primaryIntent !== 'crm') {
            secondaryAgents.push({
                type: 'crm_agent',
                priority: 3,
                reasoning: 'Contact information detected in query',
                capabilities: ['contact_management', 'lead_qualification'],
                maturityLevel: 'M3',
                estimatedProcessingTime: this.getBaseProcessingTime(complexity) * 0.5
            });
        }
        if (complexity === 'high' && primaryIntent !== 'content_generation') {
            secondaryAgents.push({
                type: 'content_agent',
                priority: 4,
                reasoning: 'Complex task requires documentation and communication support',
                capabilities: ['documentation', 'summary_generation'],
                maturityLevel: 'M4',
                estimatedProcessingTime: this.getBaseProcessingTime(complexity) * 0.3
            });
        }
        return secondaryAgents;
    }
    selectFallbackAgents(selectedAgents) {
        const fallbacks = [{
                type: 'general_assistant',
                priority: 99,
                reasoning: 'Ultimate fallback for any processing failures',
                capabilities: ['general_query_processing', 'error_handling'],
                maturityLevel: 'M2',
                estimatedProcessingTime: 2000
            }];
        selectedAgents.forEach(agent => {
            if (agent.type === 'recruitment_agent') {
                fallbacks.push({
                    type: 'content_agent',
                    priority: 10,
                    reasoning: 'Fallback for recruitment agent using content generation',
                    capabilities: ['text_processing', 'data_analysis'],
                    maturityLevel: 'M4',
                    estimatedProcessingTime: 4000
                });
            }
        });
        return fallbacks;
    }
    calculateRoutingConfidence(nlpAnalysis, selectedAgents) {
        let confidence = nlpAnalysis.confidence;
        if (selectedAgents.length > 0 && selectedAgents[0].priority === 1) {
            confidence += 0.1;
        }
        const fallbackCount = selectedAgents.filter(a => a.priority > 5).length;
        confidence -= fallbackCount * 0.05;
        return Math.max(0.1, Math.min(0.95, confidence));
    }
    generateRoutingReasoning(nlpAnalysis, selectedAgents) {
        const reasons = [
            `Intent "${nlpAnalysis.intent.category}" detected with ${(nlpAnalysis.confidence * 100).toFixed(0)}% confidence`,
            `Task complexity assessed as ${nlpAnalysis.complexity}`,
            `Selected ${selectedAgents.length} agent(s) for processing`
        ];
        if (selectedAgents.length > 1) {
            reasons.push(`Multi-agent approach chosen for comprehensive handling`);
        }
        return reasons.join('. ');
    }
    estimateProcessingTime(selectedAgents, complexity) {
        if (selectedAgents.length === 0)
            return 1000;
        const maxTime = Math.max(...selectedAgents.map(a => a.estimatedProcessingTime));
        const avgTime = selectedAgents.reduce((sum, a) => sum + a.estimatedProcessingTime, 0) / selectedAgents.length;
        return Math.round(selectedAgents.length > 1 ? avgTime : maxTime);
    }
    requiresSequentialProcessing(intentCategory) {
        return ['project_management', 'treasury_control'].includes(intentCategory);
    }
    isSingleDomainTask(intentCategory) {
        return ['content_generation'].includes(intentCategory);
    }
    getBaseProcessingTime(complexity) {
        switch (complexity) {
            case 'low': return 1500;
            case 'medium': return 3000;
            case 'high': return 5000;
            default: return 2000;
        }
    }
}
exports.TaskRouter = TaskRouter;
//# sourceMappingURL=taskRouter.js.map