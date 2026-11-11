import type { Wording } from '@/shared/lib/view'

import type { RunErrorCode } from './runs.types'

/** The label of each error code of a failed run in each view: why the work stopped. */
export const runErrorLabels = {
  provider_error: { developer: 'The agents could not reach the model service.' },
  step_limit_exceeded: { developer: 'The work reached its limit of steps.' },
  cost_limit_exceeded: { developer: 'The work reached its budget.' },
  budget_exceeded: { developer: 'Your budget of the month is used up.' },
  timeout: { developer: 'A step took too long.' },
  item_conflict: { developer: 'Another run changed the same items.' },
  server_restarted: { developer: 'The server restarted during the work.' },
} as const satisfies Record<RunErrorCode, Wording>
