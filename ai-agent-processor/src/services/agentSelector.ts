import { logger } from '../utils/logger';

export interface ServiceSelection {
  service: 'openai' | 'anthropic';
  model: string;
  reasoning: string;
  confidence: number;
}

export class AgentSelector {
  /**
   * Selects the most appropriate AI service and model for a given agent type and query
   */
  public async selectAIService(
    agentType: string,
    query: string,
    capabilities: string[]
  ): Promise<ServiceSelection> {
    try {
      logger.info('Selecting AI service', { agentType, capabilities, queryLength: query.length });

      // Check API key availability
      const openaiAvailable = !!process.env.OPENAI_API_KEY;
      const anthropicAvailable = !!process.env.ANTHROPIC_API_KEY;

      if (!openaiAvailable && !anthropicAvailable) {
        throw new Error('No AI service API keys configured');
      }

      // Agent-specific service preferences based on capabilities and use cases
      const selection = this.getServicePreference(agentType, query, capabilities, {
        openaiAvailable,
        anthropicAvailable
      });

      logger.info('AI service selected', {
        agentType,
        selectedService: selection.service,
        selectedModel: selection.model,
        reasoning: selection.reasoning
      });

      return selection;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('AI service selection failed', { agentType, error: errorMessage });
      throw new Error(`AI service selection failed: ${errorMessage}`);
    }
  }

  private getServicePreference(
    agentType: string,
    query: string,
    capabilities: string[],
    availability: { openaiAvailable: boolean; anthropicAvailable: boolean }
  ): ServiceSelection {
    
    const queryLength = query.length;
    const isComplexQuery = queryLength > 1000 || query.split(' ').length > 200;
    const hasFinancialContent = this.detectFinancialContent(query);
    const hasCreativeContent = this.detectCreativeContent(query);
    const hasAnalyticalContent = this.detectAnalyticalContent(query);

    // Service selection logic based on agent type and content analysis
    const selectionRules: Array<{
      condition: boolean;
      service: 'openai' | 'anthropic';
      model: string;
      reasoning: string;
      confidence: number;
    }> = [
      // Financial and treasury operations prefer OpenAI for structured processing
      {
        condition: agentType === 'treasury_agent' || hasFinancialContent,
        service: 'openai',
        model: 'gpt-4o',
        reasoning: 'OpenAI excels at financial analysis and structured data processing',
        confidence: 0.85
      },

      // Content generation often benefits from Anthropic's writing capabilities
      {
        condition: agentType === 'content_agent' || hasCreativeContent,
        service: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        reasoning: 'Anthropic excels at creative content generation and writing tasks',
        confidence: 0.80
      },

      // Complex analytical tasks favor Anthropic for reasoning
      {
        condition: agentType === 'project_agent' || (hasAnalyticalContent && isComplexQuery),
        service: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        reasoning: 'Anthropic provides superior reasoning for complex analytical tasks',
        confidence: 0.75
      },

      // Recruitment tasks benefit from OpenAI's structured output
      {
        condition: agentType === 'recruitment_agent',
        service: 'openai',
        model: 'gpt-4o',
        reasoning: 'OpenAI provides excellent structured analysis for recruitment tasks',
        confidence: 0.70
      },

      // CRM tasks can use either, but OpenAI for data processing
      {
        condition: agentType === 'crm_agent',
        service: 'openai',
        model: 'gpt-4o',
        reasoning: 'OpenAI handles customer data analysis and lead scoring effectively',
        confidence: 0.65
      },

      // General assistant prefers available service with highest capability
      {
        condition: agentType === 'general_assistant',
        service: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        reasoning: 'Anthropic provides balanced performance for general assistance tasks',
        confidence: 0.60
      }
    ];

    // Find the best matching rule
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

    // Fallback logic
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

  private detectFinancialContent(query: string): boolean {
    const financialKeywords = [
      'payment', 'invoice', 'budget', 'cost', 'price', 'financial', 'money',
      'revenue', 'profit', 'expense', 'transaction', 'billing', 'accounting',
      'treasury', 'cash', 'flow', 'investment', 'tax', 'compliance'
    ];

    const queryLower = query.toLowerCase();
    return financialKeywords.some(keyword => queryLower.includes(keyword));
  }

  private detectCreativeContent(query: string): boolean {
    const creativeKeywords = [
      'write', 'create', 'generate', 'content', 'blog', 'article', 'story',
      'marketing', 'copy', 'description', 'creative', 'draft', 'compose',
      'email', 'letter', 'proposal', 'presentation', 'script', 'narrative'
    ];

    const queryLower = query.toLowerCase();
    return creativeKeywords.some(keyword => queryLower.includes(keyword));
  }

  private detectAnalyticalContent(query: string): boolean {
    const analyticalKeywords = [
      'analyze', 'analysis', 'compare', 'evaluate', 'assess', 'review',
      'research', 'investigate', 'examine', 'study', 'breakdown', 'insights',
      'trends', 'patterns', 'metrics', 'data', 'statistics', 'report'
    ];

    const queryLower = query.toLowerCase();
    return analyticalKeywords.some(keyword => queryLower.includes(keyword));
  }

  /**
   * Get agent capabilities based on agent type
   */
  public getAgentCapabilities(agentType: string): string[] {
    const capabilityMap: Record<string, string[]> = {
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

  /**
   * Validate if an agent type is supported
   */
  public isAgentTypeSupported(agentType: string): boolean {
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
