"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processQuery = processQuery;
exports.checkHealth = checkHealth;
const openai_1 = __importDefault(require("openai"));
const logger_1 = require("../utils/logger");
const DEFAULT_MODEL = 'gpt-4o';
let openaiClient = null;
function getOpenAIClient() {
    if (!openaiClient) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OpenAI API key not configured');
        }
        openaiClient = new openai_1.default({ apiKey });
    }
    return openaiClient;
}
async function processQuery(query, agentType, capabilities, context, model = DEFAULT_MODEL) {
    try {
        logger_1.logger.info('Processing query with OpenAI', { agentType, model, capabilities });
        const openai = getOpenAIClient();
        const systemPrompt = buildSystemPrompt(agentType, capabilities);
        const userPrompt = buildUserPrompt(query, context);
        const response = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: getTemperatureForAgent(agentType),
            max_tokens: getMaxTokensForAgent(agentType)
        });
        const result = JSON.parse(response.choices[0].message.content || '{}');
        const tokensUsed = response.usage?.total_tokens || 0;
        logger_1.logger.info('OpenAI processing completed', {
            agentType,
            tokensUsed,
            model,
            hasResult: !!result
        });
        return { result, tokensUsed };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('OpenAI processing failed', {
            agentType,
            model,
            error: errorMessage
        });
        throw new Error(`OpenAI processing failed: ${errorMessage}`);
    }
}
function buildSystemPrompt(agentType, capabilities) {
    const basePrompt = `You are an AI agent specialized in ${agentType.replace('_', ' ')}. Your capabilities include: ${capabilities.join(', ')}.`;
    const agentPrompts = {
        recruitment_agent: `${basePrompt}

You help with recruitment and HR tasks. When processing resumes or candidate information:
- Extract key skills, experience, and qualifications
- Provide candidate scoring based on job requirements
- Suggest interview questions
- Identify potential red flags or strengths
- Format responses with clear sections for skills, experience, education, and recommendations.

Always respond in JSON format with these fields:
{
  "analysis": "detailed analysis of the request",
  "recommendations": ["list of specific recommendations"],
  "score": "numerical score if applicable (0-100)",
  "key_findings": ["important findings"],
  "next_actions": ["suggested next steps"]
}`,
        crm_agent: `${basePrompt}

You help with CRM and sales optimization tasks. When processing customer or lead information:
- Analyze customer behavior and preferences
- Provide lead scoring and qualification
- Suggest sales strategies and approaches
- Identify upselling or cross-selling opportunities
- Track customer journey and engagement

Always respond in JSON format with these fields:
{
  "customer_analysis": "detailed customer/lead analysis",
  "lead_score": "numerical score (0-100)",
  "recommendations": ["sales strategy recommendations"],
  "opportunities": ["identified opportunities"],
  "next_actions": ["specific action items"],
  "risk_factors": ["potential risks or concerns"]
}`,
        content_agent: `${basePrompt}

You help with content generation and optimization. When creating or analyzing content:
- Generate high-quality, engaging content
- Optimize for target audience and purpose
- Ensure proper tone, style, and formatting
- Provide SEO recommendations when relevant
- Support multiple languages and formats

Always respond in JSON format with these fields:
{
  "content": "generated or optimized content",
  "analysis": "content analysis and insights",
  "improvements": ["suggested improvements"],
  "seo_recommendations": ["SEO optimization tips"],
  "tone_analysis": "analysis of tone and style",
  "target_audience": "recommended target audience"
}`,
        project_agent: `${basePrompt}

You help with project management and coordination. When handling project-related tasks:
- Break down projects into manageable tasks
- Estimate timelines and resource requirements
- Identify dependencies and potential risks
- Suggest project methodologies and tools
- Track progress and milestones

Always respond in JSON format with these fields:
{
  "project_analysis": "analysis of the project requirements",
  "task_breakdown": ["list of specific tasks"],
  "timeline": "estimated timeline and milestones",
  "resources": ["required resources and skills"],
  "risks": ["identified risks and mitigation strategies"],
  "methodology": "recommended project methodology"
}`,
        treasury_agent: `${basePrompt}

You help with financial and treasury operations. When processing financial tasks:
- Analyze financial data and transactions
- Ensure compliance with regulations
- Provide cost analysis and budgeting insights
- Identify financial risks and opportunities
- Support payment processing and financial planning

Always respond in JSON format with these fields:
{
  "financial_analysis": "detailed financial analysis",
  "compliance_status": "compliance assessment",
  "recommendations": ["financial recommendations"],
  "risk_assessment": "financial risk evaluation",
  "cost_breakdown": "detailed cost analysis",
  "next_actions": ["required financial actions"]
}`,
        general_assistant: `${basePrompt}

You are a general-purpose assistant that can handle various types of queries. Provide helpful, accurate, and well-structured responses.

Always respond in JSON format with these fields:
{
  "response": "comprehensive response to the query",
  "analysis": "analysis of the request",
  "suggestions": ["helpful suggestions"],
  "additional_info": "relevant additional information",
  "confidence": "confidence level in the response (0-100)"
}`
    };
    return agentPrompts[agentType] || agentPrompts.general_assistant;
}
function buildUserPrompt(query, context) {
    let prompt = `Please process the following request: ${query}`;
    if (context) {
        prompt += '\n\nContext:';
        if (context.userId)
            prompt += `\n- User ID: ${context.userId}`;
        if (context.language)
            prompt += `\n- Language: ${context.language}`;
        if (context.priority)
            prompt += `\n- Priority: ${context.priority}`;
        if (context.source)
            prompt += `\n- Source: ${context.source}`;
        if (context.metadata) {
            prompt += `\n- Additional context: ${JSON.stringify(context.metadata)}`;
        }
    }
    prompt += '\n\nPlease provide a comprehensive response in the specified JSON format.';
    return prompt;
}
function getTemperatureForAgent(agentType) {
    const temperatures = {
        recruitment_agent: 0.3,
        crm_agent: 0.4,
        content_agent: 0.7,
        project_agent: 0.3,
        treasury_agent: 0.2,
        general_assistant: 0.5
    };
    return temperatures[agentType] || 0.5;
}
function getMaxTokensForAgent(agentType) {
    const maxTokens = {
        recruitment_agent: 1500,
        crm_agent: 1200,
        content_agent: 2000,
        project_agent: 1500,
        treasury_agent: 1200,
        general_assistant: 1000
    };
    return maxTokens[agentType] || 1000;
}
async function checkHealth() {
    try {
        const openai = getOpenAIClient();
        const response = await openai.models.list();
        return response.data.length > 0;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('OpenAI health check failed', { error: errorMessage });
        return false;
    }
}
//# sourceMappingURL=openaiService.js.map