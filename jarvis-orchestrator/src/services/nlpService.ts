import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { NLPAnalysis, QueryIntent, EntityExtraction } from '../types';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Performs comprehensive NLP analysis on user queries
 * Now simplified to use only extractIntent, extractEntities, and analyzeSentiment
 */
export async function analyzeQuery(query: string): Promise<NLPAnalysis> {
  try {
    logger.info('Starting NLP analysis', { queryLength: query.length });

    // Extract intent using AI
    const intent = await extractIntent(query);
    
    // Extract entities and parameters
    const entities = await extractEntities(query);
    
    const analysis: NLPAnalysis = {
      intent,
      entities,
      complexity: 'medium', // Default complexity
      priority: intent.category === 'recruitment' ? 'high' : 'medium', // Simple priority logic
      confidence: intent.confidence,
      language: 'en', // Default to English
      sentiment: await analyzeSentiment(query),
      keywords: [], // Remove keyword extraction
      timestamp: new Date().toISOString()
    };

    logger.info('NLP analysis completed', {
      intent: analysis.intent.category,
      confidence: analysis.confidence,
      complexity: analysis.complexity
    });

    return analysis;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('NLP analysis failed', { error: errorMessage });
    throw new Error(`NLP analysis failed: ${errorMessage}`);
  }
}

async function extractIntent(query: string): Promise<QueryIntent> {
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('AI intent extraction failed, using fallback', { error: errorMessage });
    // Fallback to simple keyword matching
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

async function extractEntities(query: string): Promise<EntityExtraction[]> {
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
    
    return entities.map((entity: any) => ({
      type: entity.type || 'unknown',
      value: entity.value || '',
      confidence: Math.max(0.1, Math.min(1.0, entity.confidence || 0.8)),
      startIndex: entity.startIndex || 0,
      endIndex: entity.endIndex || 0
    }));
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('AI entity extraction failed, using fallback', { error: errorMessage });
    // Fallback to regex-based extraction
    const entities: EntityExtraction[] = [];
    
    // Email extraction
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

    // Currency extraction
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

async function analyzeSentiment(query: string): Promise<'positive' | 'neutral' | 'negative'> {
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
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('AI sentiment analysis failed, using fallback', { error: errorMessage });
    // Simple fallback
    const positiveWords = ['good', 'great', 'excellent', 'love', 'amazing', 'perfect', 'wonderful', 'please', 'help'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'worst', 'disappointing', 'problem', 'issue'];
    
    const queryLower = query.toLowerCase();
    const positiveCount = positiveWords.filter(word => queryLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => queryLower.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
}