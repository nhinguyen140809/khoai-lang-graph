import { type RunStatus, runStatusesByAttention } from '@/modules/run/entities'

/**
 * The status that several runs roll up to, such as the latest runs of the threads of a project:
 * the one that needs the user most, in the order of `runStatusesByAttention`. Null without a run.
 */
export function rollupRunStatus(statuses: readonly RunStatus[]): RunStatus | null {
  return runStatusesByAttention.find((status) => statuses.includes(status)) ?? null
}
