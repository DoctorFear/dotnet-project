import { useCallback } from 'react';
import { workflowService } from '../services/workflowService';
import { useWorkflowResource } from './useWorkflowResource';

export function useCheckoutPoints(subTotal: number) {
    const load = useCallback(
        async () => {
            const [preview, balance] = await Promise.all([
                workflowService.previewPoints(0, subTotal),
                workflowService.balance(),
            ]);
            return { preview, balance };
        },
        [subTotal],
    );
    const result = useWorkflowResource(load);
    return {
        maxPoints: result.loading || result.error ? 0 : (result.data?.preview.maxPointsAllowed ?? 0),
        availablePoints: result.loading || result.error ? 0 : (result.data?.balance.currentPoints ?? 0),
        pendingPoints: result.loading || result.error ? 0 : (result.data?.balance.pendingPoints ?? 0),
        loading: result.loading,
        error: result.error,
    };
}
