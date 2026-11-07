import { createContext, useContext } from 'react';
import { workflowService } from '../services/workflowService';
import type { WorkflowApi } from '../services/workflowService';

export const WorkflowContext = createContext<{ api: WorkflowApi; preview: boolean }>({
    api: workflowService,
    preview: false,
});
export const useWorkflow = () => useContext(WorkflowContext);
