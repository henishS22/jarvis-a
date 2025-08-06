export interface ServiceSelection {
    service: 'openai' | 'anthropic';
    model: string;
    reasoning: string;
    confidence: number;
}
export declare class AgentSelector {
    selectAIService(agentType: string, query: string, capabilities: string[]): Promise<ServiceSelection>;
    private getServicePreference;
    private detectFinancialContent;
    private detectCreativeContent;
    private detectAnalyticalContent;
    getAgentCapabilities(agentType: string): string[];
    isAgentTypeSupported(agentType: string): boolean;
}
//# sourceMappingURL=agentSelector.d.ts.map