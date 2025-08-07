import { logger } from '../utils/logger';
import { NLPAnalysis, RoutingDecision, AgentSelection, TaskContext } from '../types';

/**
 * Routes tasks to appropriate agents based on NLP analysis and context
 */
export async function routeTask(nlpAnalysis: NLPAnalysis, context?: TaskContext): Promise<RoutingDecision> {
  try {
    logger.info('Starting task routing', { 
      intent: nlpAnalysis.intent.category
    });

    // Determine routing strategy
    const strategy = determineRoutingStrategy(nlpAnalysis, context);
    
    // Select appropriate agents
    const selectedAgents = await selectAgents(nlpAnalysis, strategy, context);

    const routingDecision: RoutingDecision = {
      strategy,
      selectedAgents,
      reasoning: generateRoutingReasoning(nlpAnalysis, selectedAgents),
      fallbackAgents: selectFallbackAgents(selectedAgents),
      timestamp: new Date().toISOString()
    };

    logger.info('Task routing completed', {
      strategy: routingDecision.strategy,
      agentCount: selectedAgents.length
    });

    return routingDecision;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Task routing failed', { error: errorMessage });
    throw new Error(`Task routing failed: ${errorMessage}`);
  }
}

function determineRoutingStrategy(nlpAnalysis: NLPAnalysis, context?: TaskContext): 'single' | 'parallel' {
  const { intent } = nlpAnalysis;

  // Single-domain tasks use single agent
  if (isSingleDomainTask(intent.category)) {
    return 'single';
  }

  // Default to parallel for efficiency
  return 'parallel';
}

async function selectAgents(nlpAnalysis: NLPAnalysis, strategy: string, context?: TaskContext): Promise<AgentSelection[]> {
  const { intent, entities } = nlpAnalysis;
  const selectedAgents: AgentSelection[] = [];

  // Primary agent selection based on intent
  const primaryAgent = selectPrimaryAgent(intent.category);
  if (primaryAgent) {
    selectedAgents.push(primaryAgent);
  }

  // Secondary agents based on entities
  const secondaryAgents = await selectSecondaryAgents(entities, intent.category);
  selectedAgents.push(...secondaryAgents);

  // Ensure we have at least one agent - default to content agent
  if (selectedAgents.length === 0) {
    selectedAgents.push({
      type: 'content_agent',
      reasoning: 'Default to content agent for general assistance',
      capabilities: ['text_generation', 'general_query_processing']
    });
  }

  return selectedAgents;
}

function selectPrimaryAgent(intentCategory: string): AgentSelection | null {
    // Simplified agent mapping for two-agent system
    const agentMap: Record<string, Partial<AgentSelection>> = {
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
      // Default to content agent for unrecognized intents
      return {
        type: 'content_agent',
        reasoning: `Fallback to content agent for general assistance`,
        capabilities: ['text_generation', 'content_optimization', 'multi_language']
      };
    }

    return {
      type: agentConfig.type!,
      reasoning: `Primary agent for ${intentCategory} tasks`,
      capabilities: agentConfig.capabilities!
    };
}

async function selectSecondaryAgents(entities: any[], primaryIntent: string): Promise<AgentSelection[]> {
    const secondaryAgents: AgentSelection[] = [];

    // Simplified logic for two-agent system
    // If primary is recruitment but we detect content needs, add content agent
    if (primaryIntent === 'recruitment' && entities.some(e => e.type === 'skill')) {
      secondaryAgents.push({
        type: 'content_agent',
        reasoning: 'Content generation needed for recruitment documentation',
        capabilities: ['text_generation', 'documentation']
      });
    }

    // If primary is content but we detect recruitment entities, add recruitment agent
    if (primaryIntent === 'content_generation' && (
        entities.some(e => e.type === 'person') ||
        entities.some(e => e.type === 'skill')
      )) {
      secondaryAgents.push({
        type: 'recruitment_agent',
        reasoning: 'Recruitment context detected in content request',
        capabilities: ['candidate_analysis', 'skill_assessment']
      });
    }

    return secondaryAgents;
}

function selectFallbackAgents(selectedAgents: AgentSelection[]): AgentSelection[] {
    const fallbacks: AgentSelection[] = [];

    // Cross-agent fallback strategy for two-agent system
    selectedAgents.forEach(agent => {
      if (agent.type === 'recruitment_agent') {
        fallbacks.push({
          type: 'content_agent',
          reasoning: 'Content agent fallback for recruitment tasks',
          capabilities: ['text_processing', 'data_analysis']
        });
      } else if (agent.type === 'content_agent') {
        fallbacks.push({
          type: 'recruitment_agent',
          reasoning: 'Recruitment agent fallback for content tasks',
          capabilities: ['general_processing', 'data_analysis']
        });
      }
    });

    // Ultimate fallback - use content agent as general purpose
    if (fallbacks.length === 0) {
      fallbacks.push({
        type: 'content_agent',
        reasoning: 'Content agent as ultimate fallback for general assistance',
        capabilities: ['general_query_processing', 'text_generation']
      });
    }

    return fallbacks;
}

// Remove this function completely as confidence is eliminated

function generateRoutingReasoning(nlpAnalysis: NLPAnalysis, selectedAgents: AgentSelection[]): string {
    const reasons = [
      `Intent "${nlpAnalysis.intent.category}" detected`,
      `Selected ${selectedAgents.length} agent(s) for processing`
    ];

    if (selectedAgents.length > 1) {
      reasons.push(`Multi-agent approach chosen for comprehensive handling`);
    }

    return reasons.join('. ');
}

// Remove this function completely as estimatedProcessingTime is eliminated

// Remove this function completely as sequential processing is eliminated

function isSingleDomainTask(intentCategory: string): boolean {
    // Both agent types can handle single-domain tasks effectively
    return ['content_generation', 'recruitment'].includes(intentCategory);
}

// Remove this function completely as processing time estimation is eliminated
