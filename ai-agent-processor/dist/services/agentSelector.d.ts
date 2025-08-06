export interface ServiceSelection {
    service: 'openai' | 'anthropic';
    model: string;
    reasoning: string;
    confidence: number;
}
export declare function selectAIService(agentType: string, query: string, capabilities: string[]): Promise<ServiceSelection>;
export declare function getAgentCapabilities(agentType: string): string[];
export declare function isAgentTypeSupported(agentType: string): boolean;
//# sourceMappingURL=agentSelector.d.ts.map