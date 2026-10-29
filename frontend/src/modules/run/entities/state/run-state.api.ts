import { apiEndpoints } from '@/shared/api/endpoints'
import { apiRequest } from '@/shared/api/request'

import { type RunState, runStateSchema } from './run-state.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** The workflow state of a run now. */
export function getCurrentRunState(runId: string): Promise<RunState> {
  return apiRequest(apiEndpoints.runState.path({ runId }), runStateSchema, {
    action: 'load the state of the run',
  })
}

/** The workflow state of a run after one of its steps. */
export function getRunStateAfterStep(runId: string, stepId: string): Promise<RunState> {
  return apiRequest(apiEndpoints.runStepState.path({ runId, stepId }), runStateSchema, {
    action: 'load the state of the run after a step',
  })
}
