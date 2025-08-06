import { TaskContext } from '../types';
export declare function processQuery(query: string, agentType: string, capabilities: string[], context?: TaskContext, model?: string): Promise<{
    result: any;
    tokensUsed: number;
}>;
export declare function checkHealth(): Promise<boolean>;
//# sourceMappingURL=openaiService.d.ts.map