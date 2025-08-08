import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { NLPAnalysis, QueryIntent } from '../types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

// Constants for intent classification
const INTENT_PROMPT = `
You are an AI intent classifier for a JARVIS system with two primary agents:
1. RECRUITMENT: Resume processing, candidate evaluation, hiring, interview scheduling, job-related tasks
2. CONTENT_GENERATION: Writing, creating content, blog posts, marketing materials, documentation

Analyze the user query and classify it into one of these categories. Return ONLY a JSON object with this exact structure:
{
  "category": "recruitment" | "content_generation",
  "action": "process_candidate" | "generate_content"
}

For recruitment: focus on hiring, candidates, resumes, interviews, job postings
For content_generation: focus on writing, creating, generating text, blogs, marketing, documentation

Be precise and confident in your classification.
`;

const RECRUITMENT_KEYWORDS = ['recruit', 'hire', 'candidate', 'resume', 'interview', 'job', 'talent', 'applicant'];

/**
 * Simplified NLP analysis - only intent detection for routing
 */
export async function analyzeQuery(query: string): Promise<NLPAnalysis> {
  try {
    logger.info('Starting NLP analysis', { queryLength: query.length });

    const intent = await extractIntent(query);

    const analysis: NLPAnalysis = {
      intent,
      timestamp: new Date().toISOString()
    };

    logger.info('NLP analysis completed', {
      intent: analysis.intent.category
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
          content: INTENT_PROMPT
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

    return {
      category: result.category || 'content_generation',
      action: result.action || 'generate_content'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('AI intent extraction failed, using fallback', { error: errorMessage });
    
    // Fallback to keyword matching
    return fallbackIntentClassification(query);
  }
}

function fallbackIntentClassification(query: string): QueryIntent {
  const queryLower = query.toLowerCase();
  
  const hasRecruitmentKeyword = RECRUITMENT_KEYWORDS.some(keyword => 
    queryLower.includes(keyword)
  );

  if (hasRecruitmentKeyword) {
    return {
      category: 'recruitment',
      action: 'process_candidate'
    };
  }

  return {
    category: 'content_generation',
    action: 'generate_content'
  };
}

