import { TaskContext } from '../types';
export declare class AnthropicService {
    private anthropic;
    constructor();
    processQuery(query: string, agentType: string, capabilities: string[], context?: TaskContext, model?: string): Promise<{
        result: any;
        tokensUsed: number;
    }>;
    private buildSystemPrompt;
    private buildUserPrompt;
    private getMaxTokensForAgent;
    checkHealth(): Promise<boolean>;
}
//# sourceMappingURL=anthropicService.d.ts.map