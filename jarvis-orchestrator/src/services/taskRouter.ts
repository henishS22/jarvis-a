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

  // Ensure we have at least one agent
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

function selectPrimaryAgent(intentCategory: string, complexity: string): AgentSelection | null {
    const agentMap: Record<string, Partial<AgentSelection>> = {
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
    if (!agentConfig) return null;

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

    // If we found financial entities and primary isn't treasury, add treasury agent
    if (entities.some(e => e.type === 'currency') && primaryIntent !== 'treasury_control') {
      secondaryAgents.push({
        type: 'treasury_agent',
        priority: 2,
        reasoning: 'Financial entities detected in query',
        capabilities: ['payment_processing', 'financial_analysis'],
        maturityLevel: 'M3',
        estimatedProcessingTime: getBaseProcessingTime(complexity) * 0.7
      });
    }

    // If we found contact information and primary isn't CRM, add CRM agent
    if (entities.some(e => e.type === 'email' || e.type === 'phone') && primaryIntent !== 'crm') {
      secondaryAgents.push({
        type: 'crm_agent',
        priority: 3,
        reasoning: 'Contact information detected in query',
        capabilities: ['contact_management', 'lead_qualification'],
        maturityLevel: 'M3',
        estimatedProcessingTime: getBaseProcessingTime(complexity) * 0.5
      });
    }

    // For high complexity tasks, add content agent for documentation
    if (complexity === 'high' && primaryIntent !== 'content_generation') {
      secondaryAgents.push({
        type: 'content_agent',
        priority: 4,
        reasoning: 'Complex task requires documentation and communication support',
        capabilities: ['documentation', 'summary_generation'],
        maturityLevel: 'M4',
        estimatedProcessingTime: getBaseProcessingTime(complexity) * 0.3
      });
    }

    return secondaryAgents;
}

function selectFallbackAgents(selectedAgents: AgentSelection[]): AgentSelection[] {
    // Always include general assistant as ultimate fallback
    const fallbacks: AgentSelection[] = [{
      type: 'general_assistant',
      priority: 99,
      reasoning: 'Ultimate fallback for any processing failures',
      capabilities: ['general_query_processing', 'error_handling'],
      maturityLevel: 'M2',
      estimatedProcessingTime: 2000
    }];

    // Add alternative agents for each selected agent type
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
    // Some tasks inherently require sequential processing
    return ['project_management', 'treasury_control'].includes(intentCategory);
}

function isSingleDomainTask(intentCategory: string): boolean {
    // Simple tasks that can be handled by a single agent
    return ['content_generation'].includes(intentCategory);
}

function getBaseProcessingTime(complexity: string): number {
    switch (complexity) {
      case 'low': return 1500;
      case 'medium': return 3000;
      case 'high': return 5000;
      default: return 2000;
    }
}
