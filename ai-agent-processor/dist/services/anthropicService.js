"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processQuery = processQuery;
exports.checkHealth = checkHealth;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const logger_1 = require("../utils/logger");
const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";
let anthropicClient = null;
function getAnthropicClient() {
    if (!anthropicClient) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('Anthropic API key not configured');
        }
        anthropicClient = new sdk_1.default({ apiKey });
    }
    return anthropicClient;
}
async function processQuery(query, agentType, capabilities, context, model = DEFAULT_MODEL_STR) {
    try {
        logger_1.logger.info('Processing query with Anthropic', { agentType, model, capabilities });
        const anthropic = getAnthropicClient();
        const systemPrompt = buildSystemPrompt(agentType, capabilities);
        const userPrompt = buildUserPrompt(query, context);
        const response = await anthropic.messages.create({
            model: DEFAULT_MODEL_STR,
            system: systemPrompt,
            messages: [
                { role: 'user', content: userPrompt }
            ],
            max_tokens: getMaxTokensForAgent(agentType)
        });
        const content = response.content[0];
        if (content.type !== 'text') {
            throw new Error('Unexpected response type from Anthropic');
        }
        let cleanResponse = content.text.trim();
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/^```json\n/, '').replace(/\n```$/, '');
        }
        else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/^```\n/, '').replace(/\n```$/, '');
        }
        const result = JSON.parse(cleanResponse);
        const tokensUsed = response.usage?.input_tokens + response.usage?.output_tokens || 0;
        logger_1.logger.info('Anthropic processing completed', {
            agentType,
            tokensUsed,
            model,
            hasResult: !!result
        });
        return { result, tokensUsed };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('Anthropic processing failed', {
            agentType,
            model,
            error: errorMessage
        });
        throw new Error(`Anthropic processing failed: ${errorMessage}`);
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
      }
    `,
        content_agent: `${basePrompt}

      You help with content generation and optimization. When creating or analyzing content:
      - Generate high-quality, engaging content
      - Optimize for target audience and purpose
      - Ensure proper tone, style, and formatting
      - Provide SEO recommendations when relevant
      - Support multiple languages and formats

      Always respond in JSON format with these fields:
      {
        "content": "generated or optimized content"
      }
    `,
        general_assistant: `${basePrompt}

      You are a general-purpose assistant that can handle various types of queries. Provide helpful, accurate, and well-structured responses.

      Always respond in JSON format with these fields:
      {
        "response": "comprehensive response to the query",
        "additional_info": "relevant additional information",
      }
    `
    };
    return agentPrompts[agentType] || agentPrompts.general_assistant;
}
function buildUserPrompt(query, context) {
    let prompt = `Please process the following request: ${query}`;
    if (context) {
        prompt += '\n\nContext:';
        if (context.userId)
            prompt += `\n- User ID: ${context.userId}`;
        if (context.source)
            prompt += `\n- Source: ${context.source}`;
        if (context.metadata) {
            prompt += `\n- Additional context: ${JSON.stringify(context.metadata)}`;
        }
    }
    prompt += '\n\nPlease provide a comprehensive response in the specified JSON format.';
    return prompt;
}
function getMaxTokensForAgent(agentType) {
    const maxTokens = {
        recruitment_agent: 1500,
        content_agent: 2000,
        general_assistant: 1000
    };
    return maxTokens[agentType] || 1000;
}
async function checkHealth() {
    try {
        const anthropic = getAnthropicClient();
        const response = await anthropic.messages.create({
            model: DEFAULT_MODEL_STR,
            messages: [
                { role: 'user', content: 'Hello' }
            ],
            max_tokens: 10
        });
        return response.content.length > 0;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('Anthropic health check failed', { error: errorMessage });
        return false;
    }
}
//# sourceMappingURL=anthropicService.js.map