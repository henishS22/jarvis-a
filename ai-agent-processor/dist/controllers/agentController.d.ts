import { Request, Response } from 'express';
export declare class AgentController {
    private agentSelector;
    private openaiService;
    private anthropicService;
    constructor();
    processWithAgent: (req: Request, res: Response) => Promise<void>;
}
export declare const agentController: AgentController;
//# sourceMappingURL=agentController.d.ts.map