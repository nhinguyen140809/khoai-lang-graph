import { apiEndpoints } from '@/shared/api/endpoints'
import { fetchPage, type ListPage } from '@/shared/api/request'

import { type RunStep, runStepSchema } from './run-steps.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** One page of the steps of a run, in the order they ran. */
export function listRunSteps(
  runId: string,
  cursor: string | null,
  limit: number,
): Promise<ListPage<RunStep>> {
  return fetchPage(apiEndpoints.runSteps.path({ runId }), runStepSchema, {
    limit,
    cursor,
    action: 'load the steps of the run',
  })
}
