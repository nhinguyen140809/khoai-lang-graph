import type { HookQueryOptions } from '@/shared/api/query-client'

/**
 * The options of a hook that reads something the trace changes: `isEnabled` waits until it is
 * needed, and a reload every so many milliseconds follows the agents while they write. The pages
 * turn the reload on while their project is being written to.
 */
export interface LiveTraceOptions extends HookQueryOptions {
  refetchInterval?: number | false | undefined
}
