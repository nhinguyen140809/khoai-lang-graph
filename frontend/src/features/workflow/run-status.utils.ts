export const ACTIVE_STATUSES = ['queued', 'running', 'interrupted'] as const

/** Whether a run has not ended. */
export function isActive(status: string): boolean {
  return ACTIVE_STATUSES.some((active) => active === status)
}
