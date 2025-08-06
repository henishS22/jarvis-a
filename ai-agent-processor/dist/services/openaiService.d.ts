import { TaskContext } from '../types';
export declare class OpenAIService {
    private openai;
    constructor();
    processQuery(query: string, agentType: string, capabilities: string[], context?: TaskContext, model?: string): Promise<{
        result: any;
        tokensUsed: number;
    }>;
    private buildSystemPrompt;
    private buildUserPrompt;
    private getTemperatureForAgent;
    private getMaxTokensForAgent;
    checkHealth(): Promise<boolean>;
}
//# sourceMappingURL=openaiService.d.ts.map