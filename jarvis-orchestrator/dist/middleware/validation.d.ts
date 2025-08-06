import { OrchestrationRequest } from '../types';
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    data?: OrchestrationRequest;
}
export declare function validateOrchestrationRequest(data: any): ValidationResult;
export declare function validateAgentType(agentType: string): boolean;
export declare function validatePriority(priority: string): boolean;
export declare function validateLanguage(language: string): boolean;
//# sourceMappingURL=validation.d.ts.map