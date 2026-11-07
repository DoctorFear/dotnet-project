import { useCallback } from 'react';
import { workflowService } from '../services/workflowService';
import { useWorkflowResource } from './useWorkflowResource';

export function useCheckoutPoints(subTotal: number) {
    const load = useCallback(() => workflowService.previewPoints(0, subTotal), [subTotal]);
    const result = useWorkflowResource(load);
    return {
        maxPoints: result.loading || result.error ? 0 : (result.data?.maxPointsAllowed ?? 0),
        error: result.error,
    };
}
