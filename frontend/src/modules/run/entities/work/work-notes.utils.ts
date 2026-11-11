import type { View } from '@/shared/lib/view'

import type { StepNote } from '../steps/run-steps.types'
import type { NoteGroup } from './work.types'

/**
 * The notes a view shows. A summary of the reasoning that a model provider returns (`thinking`)
 * is in the words of the model, so only the developer view shows it; the user view shows what the
 * step looked at and what it found.
 */
export function visibleNotes(notes: readonly StepNote[], view: View): StepNote[] {
  return notes.filter(({ kind }) => view === 'developer' || kind !== 'thinking')
}

/**
 * The notes in the order written, with the notes of one tool that come one after another joined in
 * one group, so that many searches read as one line. Any other note, such as a finding written
 * between two searches, ends the group, and the next use of the tool starts a new one.
 */
export function groupNotes(notes: readonly StepNote[]): NoteGroup[] {
  const groups: NoteGroup[] = []
  for (const note of notes) {
    const tool = note.kind === 'tool' ? (note.tool ?? 'tool') : null
    const last = groups.at(-1)
    if (tool !== null && last?.type === 'tool' && last.tool === tool) {
      last.notes.push(note)
    } else if (tool !== null) {
      groups.push({ type: 'tool', tool, notes: [note] })
    } else {
      groups.push({ type: 'note', note })
    }
  }
  return groups
}
