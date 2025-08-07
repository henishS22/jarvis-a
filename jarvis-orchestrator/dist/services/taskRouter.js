"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeTask = routeTask;
const logger_1 = require("../utils/logger");
async function routeTask(nlpAnalysis, context) {
    try {
        logger_1.logger.info('Starting task routing', {
            intent: nlpAnalysis.intent.category
        });
        const strategy = determineRoutingStrategy(nlpAnalysis, context);
        const selectedAgents = await selectAgents(nlpAnalysis, strategy, context);
        const routingDecision = {
            strategy,
            selectedAgents,
            reasoning: generateRoutingReasoning(nlpAnalysis, selectedAgents),
            fallbackAgents: selectFallbackAgents(selectedAgents),
            timestamp: new Date().toISOString()
        };
        logger_1.logger.info('Task routing completed', {
            strategy: routingDecision.strategy,
            agentCount: selectedAgents.length
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
    const { intent } = nlpAnalysis;
    if (isSingleDomainTask(intent.category)) {
        return 'single';
    }
    return 'parallel';
}
async function selectAgents(nlpAnalysis, strategy, context) {
    const { intent, entities } = nlpAnalysis;
    const selectedAgents = [];
    const primaryAgent = selectPrimaryAgent(intent.category);
    if (primaryAgent) {
        selectedAgents.push(primaryAgent);
    }
    const secondaryAgents = await selectSecondaryAgents(entities, intent.category);
    selectedAgents.push(...secondaryAgents);
    if (selectedAgents.length === 0) {
        selectedAgents.push({
            type: 'content_agent',
            reasoning: 'Default to content agent for general assistance',
            capabilities: ['text_generation', 'general_query_processing']
        });
    }
    return selectedAgents;
}
function selectPrimaryAgent(intentCategory) {
    const agentMap = {
        recruitment: {
            type: 'recruitment_agent',
            capabilities: ['resume_processing', 'candidate_scoring', 'interview_scheduling']
        },
        content_generation: {
            type: 'content_agent',
            capabilities: ['text_generation', 'content_optimization', 'multi_language']
        }
    };
    const agentConfig = agentMap[intentCategory];
    if (!agentConfig) {
        return {
            type: 'content_agent',
            reasoning: `Fallback to content agent for general assistance`,
            capabilities: ['text_generation', 'content_optimization', 'multi_language']
        };
    }
    return {
        type: agentConfig.type,
        reasoning: `Primary agent for ${intentCategory} tasks`,
        capabilities: agentConfig.capabilities
    };
}
async function selectSecondaryAgents(entities, primaryIntent) {
    const secondaryAgents = [];
    if (primaryIntent === 'recruitment' && entities.some(e => e.type === 'skill')) {
        secondaryAgents.push({
            type: 'content_agent',
            reasoning: 'Content generation needed for recruitment documentation',
            capabilities: ['text_generation', 'documentation']
        });
    }
    if (primaryIntent === 'content_generation' && (entities.some(e => e.type === 'person') ||
        entities.some(e => e.type === 'skill'))) {
        secondaryAgents.push({
            type: 'recruitment_agent',
            reasoning: 'Recruitment context detected in content request',
            capabilities: ['candidate_analysis', 'skill_assessment']
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
                reasoning: 'Content agent fallback for recruitment tasks',
                capabilities: ['text_processing', 'data_analysis']
            });
        }
        else if (agent.type === 'content_agent') {
            fallbacks.push({
                type: 'recruitment_agent',
                reasoning: 'Recruitment agent fallback for content tasks',
                capabilities: ['general_processing', 'data_analysis']
            });
        }
    });
    if (fallbacks.length === 0) {
        fallbacks.push({
            type: 'content_agent',
            reasoning: 'Content agent as ultimate fallback for general assistance',
            capabilities: ['general_query_processing', 'text_generation']
        });
    }
    return fallbacks;
}
function generateRoutingReasoning(nlpAnalysis, selectedAgents) {
    const reasons = [
        `Intent "${nlpAnalysis.intent.category}" detected`,
        `Selected ${selectedAgents.length} agent(s) for processing`
    ];
    if (selectedAgents.length > 1) {
        reasons.push(`Multi-agent approach chosen for comprehensive handling`);
    }
    return reasons.join('. ');
}
function isSingleDomainTask(intentCategory) {
    return ['content_generation', 'recruitment'].includes(intentCategory);
}
//# sourceMappingURL=taskRouter.js.map