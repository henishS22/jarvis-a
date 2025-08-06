import { AgentSelection, OrchestrationRequest, AgentResult } from '../types';
export declare class AgentCommunicator {
    private readonly agentServiceUrl;
    private readonly timeout;
    constructor();
    processWithAgents(selectedAgents: AgentSelection[], request: OrchestrationRequest, requestId: string): Promise<AgentResult[]>;
    private callAgent;
    private processFallback;
    checkAgentServiceHealth(): Promise<boolean>;
    getAvailableAgentTypes(): Promise<string[]>;
}
//# sourceMappingURL=agentCommunicator.d.ts.map