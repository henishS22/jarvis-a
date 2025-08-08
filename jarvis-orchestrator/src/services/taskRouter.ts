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
  const { intent } = nlpAnalysis;
  const selectedAgents: AgentSelection[] = [];

  // Simplified agent selection - directly map intent to agent
  const primaryAgent = selectPrimaryAgent(intent.category);
  if (primaryAgent) {
    selectedAgents.push(primaryAgent);
  }

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


function selectFallbackAgents(selectedAgents: AgentSelection[]): AgentSelection[] {
    // Simplified fallback - always use content agent as fallback
    return [{
      type: 'content_agent',
      reasoning: 'Content agent as fallback for general assistance',
      capabilities: ['general_query_processing', 'text_generation']
    }];
}

function generateRoutingReasoning(nlpAnalysis: NLPAnalysis, selectedAgents: AgentSelection[]): string {
    return `Intent "${nlpAnalysis.intent.category}" detected. Selected ${selectedAgents.length} agent(s) for processing.`;
}

function isSingleDomainTask(intentCategory: string): boolean {
    return ['content_generation', 'recruitment'].includes(intentCategory);
}
