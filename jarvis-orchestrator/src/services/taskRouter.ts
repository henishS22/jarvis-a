import { logger } from '../utils/logger';
import { NLPAnalysis, RoutingDecision, AgentSelection, TaskContext } from '../types';

/**
 * Routes tasks to appropriate agents based on NLP analysis and context
 */
export async function routeTask(nlpAnalysis: NLPAnalysis, context?: TaskContext): Promise<RoutingDecision> {
  try {
    logger.info('Starting task routing', { 
      intent: nlpAnalysis.intent.category,
      complexity: nlpAnalysis.complexity 
    });

    // Determine routing strategy
    const strategy = determineRoutingStrategy(nlpAnalysis, context);
    
    // Select appropriate agents
    const selectedAgents = await selectAgents(nlpAnalysis, strategy, context);
    
    // Calculate overall confidence
    const confidence = calculateRoutingConfidence(nlpAnalysis, selectedAgents);

    const routingDecision: RoutingDecision = {
      strategy,
      selectedAgents,
      confidence,
      reasoning: generateRoutingReasoning(nlpAnalysis, selectedAgents),
      fallbackAgents: selectFallbackAgents(selectedAgents),
      estimatedProcessingTime: estimateProcessingTime(selectedAgents, nlpAnalysis.complexity),
      timestamp: new Date().toISOString()
    };

    logger.info('Task routing completed', {
      strategy: routingDecision.strategy,
      agentCount: selectedAgents.length,
      confidence: confidence
    });

    return routingDecision;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Task routing failed', { error: errorMessage });
    throw new Error(`Task routing failed: ${errorMessage}`);
  }
}

function determineRoutingStrategy(nlpAnalysis: NLPAnalysis, context?: TaskContext): 'single' | 'parallel' | 'sequential' | 'hybrid' {
  const { intent, complexity, priority } = nlpAnalysis;

  // High-priority or urgent tasks prefer parallel processing
  if (priority === 'urgent' || priority === 'high') {
    return complexity === 'high' ? 'hybrid' : 'parallel';
  }

  // Complex tasks that require multiple steps use sequential
  if (complexity === 'high' && requiresSequentialProcessing(intent.category)) {
    return 'sequential';
  }

  // Simple, single-domain tasks use single agent
  if (complexity === 'low' && isSingleDomainTask(intent.category)) {
    return 'single';
  }

  // Default to parallel for efficiency
  return 'parallel';
}

async function selectAgents(nlpAnalysis: NLPAnalysis, strategy: string, context?: TaskContext): Promise<AgentSelection[]> {
  const { intent, entities, complexity } = nlpAnalysis;
  const selectedAgents: AgentSelection[] = [];

  // Primary agent selection based on intent
  const primaryAgent = selectPrimaryAgent(intent.category, complexity);
  if (primaryAgent) {
    selectedAgents.push(primaryAgent);
  }

  // Secondary agents based on entities and complexity
  const secondaryAgents = await selectSecondaryAgents(entities, complexity, intent.category);
  selectedAgents.push(...secondaryAgents);

  // Ensure we have at least one agent - default to content agent
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

function selectPrimaryAgent(intentCategory: string, complexity: string): AgentSelection | null {
    // Simplified agent mapping for two-agent system
    const agentMap: Record<string, Partial<AgentSelection>> = {
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
      // Default to content agent for unrecognized intents
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
      type: agentConfig.type!,
      priority: 1,
      reasoning: `Primary agent for ${intentCategory} tasks`,
      capabilities: agentConfig.capabilities!,
      maturityLevel: agentConfig.maturityLevel!,
      estimatedProcessingTime: getBaseProcessingTime(complexity)
    };
}

async function selectSecondaryAgents(entities: any[], complexity: string, primaryIntent: string): Promise<AgentSelection[]> {
    const secondaryAgents: AgentSelection[] = [];

    // Simplified logic for two-agent system
    // If primary is recruitment but we detect content needs, add content agent
    if (primaryIntent === 'recruitment' && (
        entities.some(e => e.type === 'skill') || 
        complexity === 'high'
      )) {
      secondaryAgents.push({
        type: 'content_agent',
        priority: 2,
        reasoning: 'Content generation needed for recruitment documentation',
        capabilities: ['text_generation', 'documentation'],
        maturityLevel: 'M4',
        estimatedProcessingTime: getBaseProcessingTime(complexity) * 0.6
      });
    }

    // If primary is content but we detect recruitment entities, add recruitment agent
    if (primaryIntent === 'content_generation' && (
        entities.some(e => e.type === 'person') ||
        entities.some(e => e.type === 'skill')
      )) {
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

function selectFallbackAgents(selectedAgents: AgentSelection[]): AgentSelection[] {
    const fallbacks: AgentSelection[] = [];

    // Cross-agent fallback strategy for two-agent system
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
      } else if (agent.type === 'content_agent') {
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

    // Ultimate fallback - use content agent as general purpose
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

function calculateRoutingConfidence(nlpAnalysis: NLPAnalysis, selectedAgents: AgentSelection[]): number {
    let confidence = nlpAnalysis.confidence;

    // Boost confidence if we have a direct match
    if (selectedAgents.length > 0 && selectedAgents[0].priority === 1) {
      confidence += 0.1;
    }

    // Reduce confidence if we're using many fallback agents
    const fallbackCount = selectedAgents.filter(a => a.priority > 5).length;
    confidence -= fallbackCount * 0.05;

    return Math.max(0.1, Math.min(0.95, confidence));
}

function generateRoutingReasoning(nlpAnalysis: NLPAnalysis, selectedAgents: AgentSelection[]): string {
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

function estimateProcessingTime(selectedAgents: AgentSelection[], complexity: string): number {
    if (selectedAgents.length === 0) return 1000;

    const maxTime = Math.max(...selectedAgents.map(a => a.estimatedProcessingTime));
    const avgTime = selectedAgents.reduce((sum, a) => sum + a.estimatedProcessingTime, 0) / selectedAgents.length;

    // Return max time for sequential, average for parallel
    return Math.round(selectedAgents.length > 1 ? avgTime : maxTime);
}

function requiresSequentialProcessing(intentCategory: string): boolean {
    // Simplified for two-agent system - most tasks can be parallel
    return false; // Both recruitment and content can work in parallel
}

function isSingleDomainTask(intentCategory: string): boolean {
    // Both agent types can handle single-domain tasks effectively
    return ['content_generation', 'recruitment'].includes(intentCategory);
}

function getBaseProcessingTime(complexity: string): number {
    // Simplified - always use medium complexity processing time
    return 3000;
}
