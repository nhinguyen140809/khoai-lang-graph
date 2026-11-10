import type { View } from '@/shared/lib/view'

import type { StepNote } from '../steps/run-steps.types'

/**
 * The notes a view shows. A summary of the reasoning that a model provider returns (`thinking`)
 * is in the words of the model, so only the developer view shows it; the user view shows what the
 * step looked at and what it found.
 */
export function visibleNotes(notes: readonly StepNote[], view: View): StepNote[] {
  return notes.filter(({ kind }) => view === 'developer' || kind !== 'thinking')
}
