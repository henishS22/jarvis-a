import { AgentSelection, OrchestrationRequest, AgentResult } from '../types';
export declare function processWithAgents(selectedAgents: AgentSelection[], request: OrchestrationRequest, requestId: string): Promise<AgentResult[]>;
export declare function checkAgentServiceHealth(): Promise<boolean>;
export declare function getAvailableAgentTypes(): Promise<string[]>;
//# sourceMappingURL=agentCommunicator.d.ts.map