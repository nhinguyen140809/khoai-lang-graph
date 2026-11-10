import { describe, expect, it } from 'vitest'

import type { StepNote } from '../../steps/run-steps.types'
import { visibleNotes } from '../work-notes.utils'

const notes: StepNote[] = [
  { kind: 'doing', text: 'I read the interviews.', created_at: '2026-10-06T08:30:01Z' },
  { kind: 'thinking', text: 'The two goals compete.', created_at: '2026-10-06T08:30:02Z' },
  { kind: 'finding', text: 'One **conflict** is open.', created_at: '2026-10-06T08:30:03Z' },
]

describe('visibleNotes', () => {
  it('shows what the step looked at and found, in the order written, in the user view', () => {
    expect(visibleNotes(notes, 'user').map(({ kind }) => kind)).toEqual(['doing', 'finding'])
  })

  it('also shows the reasoning of the model in the developer view', () => {
    expect(visibleNotes(notes, 'developer')).toEqual(notes)
  })

  it('has nothing to show for a step without notes', () => {
    expect(visibleNotes([], 'user')).toEqual([])
  })
})
