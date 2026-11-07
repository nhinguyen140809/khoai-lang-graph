import type { Wording } from '@/shared/lib/view'

import { runErrorLabels } from './run-error.constants'

/** The words of the error code of a run; null for a code that the app does not know. */
export function runErrorLabel(code: string): Wording | null {
  const labels: Readonly<Record<string, Wording | undefined>> = runErrorLabels
  return labels[code] ?? null
}
