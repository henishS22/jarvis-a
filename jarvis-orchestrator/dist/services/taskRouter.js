"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeTask = routeTask;
const logger_1 = require("../utils/logger");
async function routeTask(nlpAnalysis, context) {
    try {
        logger_1.logger.info('Starting task routing', {
            intent: nlpAnalysis.intent.category,
            complexity: nlpAnalysis.complexity
        });
        const strategy = determineRoutingStrategy(nlpAnalysis, context);
        const selectedAgents = await selectAgents(nlpAnalysis, strategy, context);
        const confidence = calculateRoutingConfidence(nlpAnalysis, selectedAgents);
        const routingDecision = {
            strategy,
            selectedAgents,
            confidence,
            reasoning: generateRoutingReasoning(nlpAnalysis, selectedAgents),
            fallbackAgents: selectFallbackAgents(selectedAgents),
            estimatedProcessingTime: estimateProcessingTime(selectedAgents, nlpAnalysis.complexity),
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
function determineRoutingStrategy(nlpAnalysis, context) {
    const { intent, complexity, priority } = nlpAnalysis;
    if (priority === 'urgent' || priority === 'high') {
        return complexity === 'high' ? 'hybrid' : 'parallel';
    }
    if (complexity === 'high' && requiresSequentialProcessing(intent.category)) {
        return 'sequential';
    }
    if (complexity === 'low' && isSingleDomainTask(intent.category)) {
        return 'single';
    }
    return 'parallel';
}
async function selectAgents(nlpAnalysis, strategy, context) {
    const { intent, entities, complexity } = nlpAnalysis;
    const selectedAgents = [];
    const primaryAgent = selectPrimaryAgent(intent.category, complexity);
    if (primaryAgent) {
        selectedAgents.push(primaryAgent);
    }
    const secondaryAgents = await selectSecondaryAgents(entities, complexity, intent.category);
    selectedAgents.push(...secondaryAgents);
    if (selectedAgents.length === 0) {
        selectedAgents.push({
            type: 'content_agent',
            priority: 1,
            reasoning: 'Default to content agent for general assistance',
            capabilities: ['text_generation', 'general_query_processing'],
            maturityLevel: 'M4',
            estimatedProcessingTime: 3000
        });
    }
    return selectedAgents;
}
function selectPrimaryAgent(intentCategory, complexity) {
    const agentMap = {
        recruitment: {
            type: 'recruitment_agent',
            capabilities: ['resume_processing', 'candidate_scoring', 'interview_scheduling'],
            maturityLevel: 'M2'
        },
        content_generation: {
            type: 'content_agent',
            capabilities: ['text_generation', 'content_optimization', 'multi_language'],
            maturityLevel: 'M4'
        }
    };
    const agentConfig = agentMap[intentCategory];
    if (!agentConfig) {
        return {
            type: 'content_agent',
            priority: 1,
            reasoning: `Fallback to content agent for general assistance`,
            capabilities: ['text_generation', 'content_optimization', 'multi_language'],
            maturityLevel: 'M4',
            estimatedProcessingTime: getBaseProcessingTime(complexity)
        };
    }
    return {
        type: agentConfig.type,
        priority: 1,
        reasoning: `Primary agent for ${intentCategory} tasks`,
        capabilities: agentConfig.capabilities,
        maturityLevel: agentConfig.maturityLevel,
        estimatedProcessingTime: getBaseProcessingTime(complexity)
    };
}
async function selectSecondaryAgents(entities, complexity, primaryIntent) {
    const secondaryAgents = [];
    if (primaryIntent === 'recruitment' && (entities.some(e => e.type === 'skill') ||
        complexity === 'high')) {
        secondaryAgents.push({
            type: 'content_agent',
            priority: 2,
            reasoning: 'Content generation needed for recruitment documentation',
            capabilities: ['text_generation', 'documentation'],
            maturityLevel: 'M4',
            estimatedProcessingTime: getBaseProcessingTime(complexity) * 0.6
        });
    }
    if (primaryIntent === 'content_generation' && (entities.some(e => e.type === 'person') ||
        entities.some(e => e.type === 'skill'))) {
        secondaryAgents.push({
            type: 'recruitment_agent',
            priority: 2,
            reasoning: 'Recruitment context detected in content request',
            capabilities: ['candidate_analysis', 'skill_assessment'],
            maturityLevel: 'M2',
            estimatedProcessingTime: getBaseProcessingTime(complexity) * 0.5
        });
    }
    return secondaryAgents;
}
function selectFallbackAgents(selectedAgents) {
    const fallbacks = [];
    selectedAgents.forEach(agent => {
        if (agent.type === 'recruitment_agent') {
            fallbacks.push({
                type: 'content_agent',
                priority: 10,
                reasoning: 'Content agent fallback for recruitment tasks',
                capabilities: ['text_processing', 'data_analysis'],
                maturityLevel: 'M4',
                estimatedProcessingTime: 4000
            });
        }
        else if (agent.type === 'content_agent') {
            fallbacks.push({
                type: 'recruitment_agent',
                priority: 10,
                reasoning: 'Recruitment agent fallback for content tasks',
                capabilities: ['general_processing', 'data_analysis'],
                maturityLevel: 'M2',
                estimatedProcessingTime: 3000
            });
        }
    });
    if (fallbacks.length === 0) {
        fallbacks.push({
            type: 'content_agent',
            priority: 99,
            reasoning: 'Content agent as ultimate fallback for general assistance',
            capabilities: ['general_query_processing', 'text_generation'],
            maturityLevel: 'M4',
            estimatedProcessingTime: 2000
        });
    }
    return fallbacks;
}
function calculateRoutingConfidence(nlpAnalysis, selectedAgents) {
    let confidence = nlpAnalysis.confidence;
    if (selectedAgents.length > 0 && selectedAgents[0].priority === 1) {
        confidence += 0.1;
    }
    const fallbackCount = selectedAgents.filter(a => a.priority > 5).length;
    confidence -= fallbackCount * 0.05;
    return Math.max(0.1, Math.min(0.95, confidence));
}
function generateRoutingReasoning(nlpAnalysis, selectedAgents) {
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
function estimateProcessingTime(selectedAgents, complexity) {
    if (selectedAgents.length === 0)
        return 1000;
    const maxTime = Math.max(...selectedAgents.map(a => a.estimatedProcessingTime));
    const avgTime = selectedAgents.reduce((sum, a) => sum + a.estimatedProcessingTime, 0) / selectedAgents.length;
    return Math.round(selectedAgents.length > 1 ? avgTime : maxTime);
}
function requiresSequentialProcessing(intentCategory) {
    return false;
}
function isSingleDomainTask(intentCategory) {
    return ['content_generation', 'recruitment'].includes(intentCategory);
}
function getBaseProcessingTime(complexity) {
    return 3000;
}
//# sourceMappingURL=taskRouter.js.map