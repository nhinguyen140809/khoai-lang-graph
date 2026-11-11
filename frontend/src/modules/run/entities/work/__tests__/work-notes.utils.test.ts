import { describe, expect, it } from 'vitest'

import type { StepNote } from '../../steps/run-steps.types'
import { groupNotes, visibleNotes } from '../work-notes.utils'

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

describe('groupNotes', () => {
  const at = '2026-10-06T08:30:00Z'
  const search = (text: string): StepNote => ({
    kind: 'tool',
    tool: 'search',
    text,
    created_at: at,
  })

  it('joins the notes of one tool that come one after another', () => {
    const groups = groupNotes([search('A.'), search('B.'), search('C.')])
    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ type: 'tool', tool: 'search' })
    expect(groups[0]?.type === 'tool' && groups[0].notes).toHaveLength(3)
  })

  it('starts a new group after a note of another kind', () => {
    const finding: StepNote = { kind: 'finding', text: 'Found.', created_at: at }
    const groups = groupNotes([search('A.'), search('B.'), finding, search('C.')])
    expect(groups.map(({ type }) => type)).toEqual(['tool', 'note', 'tool'])
  })

  it('keeps a note without a tool name together with the others of its kind', () => {
    const bare: StepNote = { kind: 'tool', text: 'X.', created_at: at }
    expect(groupNotes([bare, bare])).toHaveLength(1)
  })
})
