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
        const complexity = await assessComplexity(query, entities);
        const priority = await determinePriority(intent, complexity);
        const analysis = {
            intent,
            entities,
            complexity,
            priority,
            confidence: await calculateConfidence(intent, entities),
            language: await detectLanguage(query),
            sentiment: await analyzeSentiment(query),
            keywords: await extractKeywords(query),
            timestamp: new Date().toISOString()
        };
        logger_1.logger.info('NLP analysis completed', {
            intent: analysis.intent.category,
            confidence: analysis.confidence,
            complexity: analysis.complexity
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
            confidence: Math.max(0.1, Math.min(1.0, result.confidence || 0.7)),
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
                confidence: 0.75,
                subcategory: 'candidate_management'
            };
        }
        return {
            category: 'content_generation',
            action: 'generate_content',
            confidence: 0.70,
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
            confidence: Math.max(0.1, Math.min(1.0, entity.confidence || 0.8)),
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
                confidence: 0.95,
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
                confidence: 0.88,
                startIndex,
                endIndex: startIndex + currency.length
            });
        });
        return entities;
    }
}
async function assessComplexity(query, entities) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Assess the complexity of this user query based on:
- Length and structure of the query
- Number of different tasks or requirements
- Technical depth required
- Context switching needed
- Number of entities involved

Return ONLY a JSON object:
{
  "complexity": "low" | "medium" | "high",
  "reasoning": "brief explanation"
}

Low: Simple, single task, clear request
Medium: Multiple steps or moderate complexity
High: Complex multi-step process, technical depth, multiple domains`
                },
                {
                    role: "user",
                    content: `Query: "${query}"\nEntities found: ${entities.length}`
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 100
        });
        const result = JSON.parse(response.choices[0].message.content || '{}');
        return result.complexity || 'medium';
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('AI complexity assessment failed, using fallback', { error: errorMessage });
        const wordCount = query.split(' ').length;
        const entityCount = entities.length;
        if (wordCount < 10 && entityCount <= 2)
            return 'low';
        if (wordCount < 25 && entityCount <= 5)
            return 'medium';
        return 'high';
    }
}
async function determinePriority(intent, complexity) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Determine the priority level for this task based on:
- Intent category: ${intent.category}
- Task complexity: ${complexity}
- Business impact
- Time sensitivity

Return ONLY a JSON object:
{
  "priority": "low" | "medium" | "high" | "urgent",
  "reasoning": "brief explanation"
}

Guidelines:
- Recruitment tasks: Usually high priority (hiring is time-sensitive)
- Content generation: Usually medium priority unless urgent deadline
- Complex tasks: Increase priority by one level
- Simple routine tasks: Lower priority`
                },
                {
                    role: "user",
                    content: `Intent: ${intent.category}, Action: ${intent.action}, Complexity: ${complexity}`
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 100
        });
        const result = JSON.parse(response.choices[0].message.content || '{}');
        return result.priority || 'medium';
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('AI priority determination failed, using fallback', { error: errorMessage });
        if (intent.category === 'recruitment') {
            return complexity === 'high' ? 'urgent' : 'high';
        }
        return complexity === 'high' ? 'medium' : 'low';
    }
}
async function calculateConfidence(intent, entities) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Calculate the overall confidence for this NLP analysis based on:
- Intent classification confidence: ${intent.confidence}
- Number and quality of entities found: ${entities.length}
- Clarity of the user query
- Consistency between intent and entities

Return ONLY a JSON object:
{
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}

Consider:
- High entity confidence boosts overall confidence
- Relevant entities for the intent increase confidence
- Clear, unambiguous queries have higher confidence`
                },
                {
                    role: "user",
                    content: `Intent: ${intent.category} (confidence: ${intent.confidence}), Entities: ${entities.length} found`
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 100
        });
        const result = JSON.parse(response.choices[0].message.content || '{}');
        return Math.max(0.1, Math.min(0.95, result.confidence || intent.confidence));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('AI confidence calculation failed, using fallback', { error: errorMessage });
        let confidence = intent.confidence;
        if (entities.length > 0) {
            const avgEntityConfidence = entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
            confidence = Math.min(0.95, confidence + (avgEntityConfidence * 0.1));
        }
        return Math.round(confidence * 100) / 100;
    }
}
async function detectLanguage(query) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Detect the language of the user query. Return ONLY a JSON object:
{
  "language": "en" | "es" | "fr" | "de" | "it" | "pt" | "zh" | "ja" | "ko" | "ar",
  "confidence": 0.0-1.0
}

Use ISO 639-1 language codes. Default to "en" if unsure.`
                },
                {
                    role: "user",
                    content: query
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 50
        });
        const result = JSON.parse(response.choices[0].message.content || '{}');
        return result.language || 'en';
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('AI language detection failed, using fallback', { error: errorMessage });
        const queryLower = query.toLowerCase();
        const spanishWords = ['el', 'la', 'los', 'las', 'de', 'del', 'y', 'o', 'con', 'para'];
        const frenchWords = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'avec', 'pour'];
        const spanishCount = spanishWords.filter(word => queryLower.includes(word)).length;
        const frenchCount = frenchWords.filter(word => queryLower.includes(word)).length;
        if (spanishCount > frenchCount && spanishCount > 1)
            return 'es';
        if (frenchCount > 1)
            return 'fr';
        return 'en';
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
async function extractKeywords(query) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Extract the most important keywords from the user query. Focus on:
- Action words (verbs)
- Subject matter (nouns)
- Technical terms
- Business concepts
- Names and proper nouns

Return ONLY a JSON object:
{
  "keywords": ["word1", "word2", "word3"],
  "reasoning": "brief explanation"
}

Extract 3-8 most relevant keywords. Avoid common stop words.`
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
        return result.keywords || [];
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('AI keyword extraction failed, using fallback', { error: errorMessage });
        const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'cannot', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those'];
        const words = query.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.includes(word));
        return [...new Set(words)].slice(0, 8);
    }
}
//# sourceMappingURL=nlpService.js.map