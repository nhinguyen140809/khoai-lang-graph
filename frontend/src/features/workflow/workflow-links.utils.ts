/** The address of a run, and of one of its steps, in the workflow view. */
export function runHref(projectId: string, runId: string, stepId?: string): string {
  const base = `/projects/${encodeURIComponent(projectId)}/workflow/${encodeURIComponent(runId)}`
  return stepId === undefined ? base : `${base}?step=${encodeURIComponent(stepId)}`
}

export const ACTIVE_STATUSES = ['queued', 'running', 'interrupted'] as const

/** Whether a run has not ended. */
export function isActive(status: string): boolean {
  return ACTIVE_STATUSES.some((active) => active === status)
}
