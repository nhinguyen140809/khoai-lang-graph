/** A duration between two ISO timestamps, as a short clock string. */
export function formatStepDuration(startedAt: string, finishedAt: string | null): string {
  if (finishedAt === null) return '…'
  const seconds = Math.max(0, (Date.parse(finishedAt) - Date.parse(startedAt)) / 1000)
  if (seconds < 1) return '0s'
  if (seconds < 60) return `${String(Math.round(seconds))}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${String(minutes)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`
  const hours = Math.floor(minutes / 60)
  return `${String(hours)}:${String(minutes % 60).padStart(2, '0')}:${String(Math.round(seconds % 60)).padStart(2, '0')}`
}

/** A cost as the status bar prints it. */
export function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`
}
