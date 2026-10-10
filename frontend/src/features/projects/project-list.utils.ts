import type { UnfinishedRunCounts } from './projects.types'

/** The status of the unfinished runs that needs the user most, with the number of such runs. */
export function mostUrgentRunStatus(
  counts: UnfinishedRunCounts,
): { status: 'interrupted' | 'running' | 'queued'; count: number } | undefined {
  const status = (['interrupted', 'running', 'queued'] as const).find((key) => counts[key] > 0)
  return status === undefined ? undefined : { status, count: counts[status] }
}
