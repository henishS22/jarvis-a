import { NLPAnalysis } from '../types';
export declare class NLPService {
    analyzeQuery(query: string): Promise<NLPAnalysis>;
    private extractIntent;
    private extractEntities;
    private assessComplexity;
    private determinePriority;
    private calculateConfidence;
    private detectLanguage;
    private analyzeSentiment;
    private extractKeywords;
}
//# sourceMappingURL=nlpService.d.ts.map