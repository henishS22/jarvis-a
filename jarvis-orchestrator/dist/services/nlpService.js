"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeQuery = analyzeQuery;
const openai_1 = __importDefault(require("openai"));
const logger_1 = require("../utils/logger");
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
async function analyzeQuery(query) {
    try {
        logger_1.logger.info('Starting NLP analysis', { queryLength: query.length });
        const intent = await extractIntent(query);
        const entities = await extractEntities(query);
        const analysis = {
            intent,
            entities,
            sentiment: await analyzeSentiment(query),
            timestamp: new Date().toISOString()
        };
        logger_1.logger.info('NLP analysis completed', {
            intent: analysis.intent.category,
            sentiment: analysis.sentiment
        });
        return analysis;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('NLP analysis failed', { error: errorMessage });
        throw new Error(`NLP analysis failed: ${errorMessage}`);
    }
}
async function extractIntent(query) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an AI intent classifier for a JARVIS system with two primary agents:
1. RECRUITMENT: Resume processing, candidate evaluation, hiring, interview scheduling, job-related tasks
2. CONTENT_GENERATION: Writing, creating content, blog posts, marketing materials, documentation

Analyze the user query and classify it into one of these categories. Return ONLY a JSON object with this exact structure:
{
  "category": "recruitment" | "content_generation",
  "action": "process_candidate" | "generate_content", 
  "confidence": 0.0-1.0,
  "subcategory": "candidate_management" | "content_creation"
}

For recruitment: focus on hiring, candidates, resumes, interviews, job postings
For content_generation: focus on writing, creating, generating text, blogs, marketing, documentation

Be precise and confident in your classification.`
                },
                {
                    role: "user",
                    content: query
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 150
        });
        const result = JSON.parse(response.choices[0].message.content || '{}');
        return {
            category: result.category || 'content_generation',
            action: result.action || 'generate_content',
            subcategory: result.subcategory || 'content_creation'
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('AI intent extraction failed, using fallback', { error: errorMessage });
        const queryLower = query.toLowerCase();
        if (queryLower.includes('recruit') || queryLower.includes('hire') || queryLower.includes('candidate') || queryLower.includes('resume') || queryLower.includes('interview')) {
            return {
                category: 'recruitment',
                action: 'process_candidate',
                subcategory: 'candidate_management'
            };
        }
        return {
            category: 'content_generation',
            action: 'generate_content',
            subcategory: 'content_creation'
        };
    }
}
async function extractEntities(query) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Extract entities from the user query. Focus on these entity types:
- email: Email addresses
- phone: Phone numbers
- date: Dates in any format
- currency: Money amounts, prices, salaries
- person: Names of people
- company: Company or organization names
- skill: Technical skills, programming languages, tools
- location: Cities, countries, addresses

Return ONLY a JSON array of entities in this exact format:
[
  {
    "type": "email" | "phone" | "date" | "currency" | "person" | "company" | "skill" | "location",
    "value": "extracted text",
    "confidence": 0.0-1.0,
    "startIndex": number,
    "endIndex": number
  }
]

If no entities found, return an empty array [].`
                },
                {
                    role: "user",
                    content: query
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 300
        });
        const result = JSON.parse(response.choices[0].message.content || '{"entities": []}');
        const entities = result.entities || result || [];
        return entities.map((entity) => ({
            type: entity.type || 'unknown',
            value: entity.value || '',
            startIndex: entity.startIndex || 0,
            endIndex: entity.endIndex || 0
        }));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('AI entity extraction failed, using fallback', { error: errorMessage });
        const entities = [];
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = query.match(emailRegex) || [];
        emails.forEach(email => {
            const startIndex = query.indexOf(email);
            entities.push({
                type: 'email',
                value: email,
                startIndex,
                endIndex: startIndex + email.length
            });
        });
        const currencyRegex = /\$\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD|euros?|EUR)/gi;
        const currencies = query.match(currencyRegex) || [];
        currencies.forEach(currency => {
            const startIndex = query.indexOf(currency);
            entities.push({
                type: 'currency',
                value: currency,
                startIndex,
                endIndex: startIndex + currency.length
            });
        });
        return entities;
    }
}
async function analyzeSentiment(query) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Analyze the sentiment of the user query. Return ONLY a JSON object:
{
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}

Consider:
- Overall emotional tone
- Context and intent
- Word choices and phrasing`
                },
                {
                    role: "user",
                    content: query
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 100
        });
        const result = JSON.parse(response.choices[0].message.content || '{}');
        return result.sentiment || 'neutral';
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('AI sentiment analysis failed, using fallback', { error: errorMessage });
        const positiveWords = ['good', 'great', 'excellent', 'love', 'amazing', 'perfect', 'wonderful', 'please', 'help'];
        const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'worst', 'disappointing', 'problem', 'issue'];
        const queryLower = query.toLowerCase();
        const positiveCount = positiveWords.filter(word => queryLower.includes(word)).length;
        const negativeCount = negativeWords.filter(word => queryLower.includes(word)).length;
        if (positiveCount > negativeCount)
            return 'positive';
        if (negativeCount > positiveCount)
            return 'negative';
        return 'neutral';
    }
}
//# sourceMappingURL=nlpService.js.map