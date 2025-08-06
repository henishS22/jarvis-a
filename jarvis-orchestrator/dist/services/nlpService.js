"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NLPService = void 0;
const logger_1 = require("../utils/logger");
class NLPService {
    async analyzeQuery(query) {
        try {
            logger_1.logger.info('Starting NLP analysis', { queryLength: query.length });
            const intent = await this.extractIntent(query);
            const entities = await this.extractEntities(query);
            const complexity = this.assessComplexity(query, entities);
            const priority = this.determinePriority(intent, complexity);
            const analysis = {
                intent,
                entities,
                complexity,
                priority,
                confidence: this.calculateConfidence(intent, entities),
                language: this.detectLanguage(query),
                sentiment: await this.analyzeSentiment(query),
                keywords: this.extractKeywords(query),
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
    async extractIntent(query) {
        const queryLower = query.toLowerCase();
        if (queryLower.includes('recruit') || queryLower.includes('hire') || queryLower.includes('candidate') || queryLower.includes('resume')) {
            return {
                category: 'recruitment',
                action: 'process_candidate',
                confidence: 0.85,
                subcategory: 'candidate_management'
            };
        }
        if (queryLower.includes('lead') || queryLower.includes('sales') || queryLower.includes('crm') || queryLower.includes('customer')) {
            return {
                category: 'crm',
                action: 'manage_lead',
                confidence: 0.82,
                subcategory: 'lead_management'
            };
        }
        if (queryLower.includes('content') || queryLower.includes('generate') || queryLower.includes('write') || queryLower.includes('create')) {
            return {
                category: 'content_generation',
                action: 'generate_content',
                confidence: 0.78,
                subcategory: 'content_creation'
            };
        }
        if (queryLower.includes('project') || queryLower.includes('task') || queryLower.includes('manage') || queryLower.includes('schedule')) {
            return {
                category: 'project_management',
                action: 'manage_project',
                confidence: 0.75,
                subcategory: 'project_coordination'
            };
        }
        if (queryLower.includes('finance') || queryLower.includes('treasury') || queryLower.includes('payment') || queryLower.includes('invoice')) {
            return {
                category: 'treasury_control',
                action: 'process_financial',
                confidence: 0.80,
                subcategory: 'financial_management'
            };
        }
        return {
            category: 'general',
            action: 'process_general',
            confidence: 0.60,
            subcategory: 'general_assistance'
        };
    }
    async extractEntities(query) {
        const entities = [];
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = query.match(emailRegex) || [];
        emails.forEach(email => {
            entities.push({
                type: 'email',
                value: email,
                confidence: 0.95,
                startIndex: query.indexOf(email),
                endIndex: query.indexOf(email) + email.length
            });
        });
        const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
        const phones = query.match(phoneRegex) || [];
        phones.forEach(phone => {
            entities.push({
                type: 'phone',
                value: phone,
                confidence: 0.90,
                startIndex: query.indexOf(phone),
                endIndex: query.indexOf(phone) + phone.length
            });
        });
        const dateRegex = /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g;
        const dates = query.match(dateRegex) || [];
        dates.forEach(date => {
            entities.push({
                type: 'date',
                value: date,
                confidence: 0.85,
                startIndex: query.indexOf(date),
                endIndex: query.indexOf(date) + date.length
            });
        });
        const currencyRegex = /\$\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD|euros?|EUR)/gi;
        const currencies = query.match(currencyRegex) || [];
        currencies.forEach(currency => {
            entities.push({
                type: 'currency',
                value: currency,
                confidence: 0.88,
                startIndex: query.indexOf(currency),
                endIndex: query.indexOf(currency) + currency.length
            });
        });
        return entities;
    }
    assessComplexity(query, entities) {
        const wordCount = query.split(' ').length;
        const entityCount = entities.length;
        if (wordCount < 10 && entityCount <= 2)
            return 'low';
        if (wordCount < 25 && entityCount <= 5)
            return 'medium';
        return 'high';
    }
    determinePriority(intent, complexity) {
        if (intent.category === 'recruitment' || intent.category === 'treasury_control') {
            return complexity === 'high' ? 'urgent' : 'high';
        }
        if (intent.category === 'crm' || intent.category === 'project_management') {
            return complexity === 'high' ? 'high' : 'medium';
        }
        return complexity === 'high' ? 'medium' : 'low';
    }
    calculateConfidence(intent, entities) {
        let confidence = intent.confidence;
        if (entities.length > 0) {
            const avgEntityConfidence = entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
            confidence = Math.min(0.95, confidence + (avgEntityConfidence * 0.1));
        }
        return Math.round(confidence * 100) / 100;
    }
    detectLanguage(query) {
        const frenchWords = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'avec', 'pour'];
        const englishWords = ['the', 'and', 'or', 'with', 'for', 'to', 'from', 'by', 'at', 'in'];
        const queryLower = query.toLowerCase();
        const frenchCount = frenchWords.filter(word => queryLower.includes(word)).length;
        const englishCount = englishWords.filter(word => queryLower.includes(word)).length;
        if (frenchCount > englishCount)
            return 'fr';
        return 'en';
    }
    async analyzeSentiment(query) {
        const positiveWords = ['good', 'great', 'excellent', 'love', 'amazing', 'perfect', 'wonderful'];
        const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'worst', 'disappointing'];
        const queryLower = query.toLowerCase();
        const positiveCount = positiveWords.filter(word => queryLower.includes(word)).length;
        const negativeCount = negativeWords.filter(word => queryLower.includes(word)).length;
        if (positiveCount > negativeCount)
            return 'positive';
        if (negativeCount > positiveCount)
            return 'negative';
        return 'neutral';
    }
    extractKeywords(query) {
        const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'cannot', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those'];
        const words = query.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.includes(word));
        return [...new Set(words)];
    }
}
exports.NLPService = NLPService;
//# sourceMappingURL=nlpService.js.map