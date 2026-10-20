import { listWorkflowStages } from '../workflow.api'

/** A read of the workflow API, what the test keeps of it, and what the mock data gives. */
export const readCases = [
  {
    name: 'the label of a stage',
    read: async () =>
      (await listWorkflowStages(1)).find(({ key }) => key === 'analysis_review')?.label,
    expected: 'Analysis review',
  },
]
