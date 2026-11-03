import type { HookQueryOptions } from '@/shared/api/query-client'

import type { RunStatus } from '../status/run-status.types'

/** The options of a hook that reads something a run changes while it works. */
export interface LiveRunQueryOptions extends HookQueryOptions {
  /** The status of the run: it is read again every few seconds until the run has ended. */
  runStatus?: RunStatus | undefined
}
