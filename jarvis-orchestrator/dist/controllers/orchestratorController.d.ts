import { Request, Response } from 'express';
export declare class OrchestratorController {
    private nlpService;
    private taskRouter;
    private agentCommunicator;
    constructor();
    orchestrate: (req: Request, res: Response) => Promise<void>;
}
export declare const orchestratorController: OrchestratorController;
//# sourceMappingURL=orchestratorController.d.ts.map