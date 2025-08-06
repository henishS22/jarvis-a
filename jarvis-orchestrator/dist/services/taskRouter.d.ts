import { NLPAnalysis, RoutingDecision, TaskContext } from '../types';
export declare class TaskRouter {
    routeTask(nlpAnalysis: NLPAnalysis, context?: TaskContext): Promise<RoutingDecision>;
    private determineRoutingStrategy;
    private selectAgents;
    private selectPrimaryAgent;
    private selectSecondaryAgents;
    private selectFallbackAgents;
    private calculateRoutingConfidence;
    private generateRoutingReasoning;
    private estimateProcessingTime;
    private requiresSequentialProcessing;
    private isSingleDomainTask;
    private getBaseProcessingTime;
}
//# sourceMappingURL=taskRouter.d.ts.map