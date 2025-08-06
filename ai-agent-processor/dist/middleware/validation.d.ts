import { AgentProcessingRequest } from '../types';
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    data?: AgentProcessingRequest;
}
export declare function validateAgentRequest(data: any): ValidationResult;
export declare function validateModel(service: 'openai' | 'anthropic', model: string): boolean;
export declare function validateCapabilities(agentType: string, capabilities: string[]): boolean;
export declare function validatePriority(priority: string): boolean;
export declare function validateLanguage(language: string): boolean;
export declare function validateMaturityLevel(level: string): boolean;
//# sourceMappingURL=validation.d.ts.map