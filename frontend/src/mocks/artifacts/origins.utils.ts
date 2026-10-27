import type { Origin } from '@/modules/artifact/entities'

import { userId } from '../shared/db'

/** The origin of what the user makes in the mock server. */
export const userOrigin: Origin = {
  actor: 'user',
  agent_role: null,
  user_id: userId,
  run_id: null,
  step_id: null,
}

/** The origin of what an agent makes in a run. */
export const agentOrigin = (role: string, runId: string): Origin => ({
  actor: 'agent',
  agent_role: role,
  user_id: null,
  run_id: runId,
  step_id: null,
})
