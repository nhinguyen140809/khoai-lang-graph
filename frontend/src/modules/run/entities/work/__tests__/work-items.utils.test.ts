import { describe, expect, it } from 'vitest'

import { buildStep } from '@/mocks/runs/fixtures/runs.fixtures'
import { assertPresent } from '@/shared/lib/guards'

import type { StepNote } from '../../steps/run-steps.types'
import { workEntries } from '../work-entries.utils'
import { isPhaseOpenByDefault, phaseItems } from '../work-items.utils'

const at = (clock: string) => `2026-10-06T10:${clock}Z`
const note = (kind: StepNote['kind'], text: string, clock: string, tool?: string): StepNote => ({
  kind,
  text,
  created_at: at(clock),
  ...(tool === undefined ? {} : { tool }),
})

/** The phase of one step with the given notes; it runs unless it has finished. */
function phase(notes: StepNote[], isFinished = false) {
  const [entry] = workEntries(
    [
      buildStep({
        sequence: 1,
        agent_role: 'corpus_builder',
        stage: 'research',
        status: isFinished ? 'succeeded' : 'running',
        started_at: at('00:00'),
        finished_at: isFinished ? at('09:00') : null,
        notes,
      }),
    ],
    { status: isFinished ? 'succeeded' : 'running' },
  )
  return assertPresent(entry, 'the phase of the corpus builder')
}

describe('phaseItems', () => {
  it('gives a note for each note and one item for the uses of a tool that follow one another', () => {
    const items = phaseItems(
      phase([
        note('doing', 'Starting.', '01:00'),
        note('tool', 'One.', '02:00', 'search'),
        note('tool', 'Two.', '03:00', 'search'),
        note('finding', 'Found.', '04:00'),
        note('tool', 'Three.', '05:00', 'search'),
      ]),
      'user',
    )

    expect(items.map(({ type }) => type)).toEqual(['note', 'tool', 'note', 'tool'])
    const first = items[1]
    expect(first?.type === 'tool' && first.use.notes).toHaveLength(2)
    expect(first?.type === 'tool' && first.use.startedAt).toBe(at('02:00'))
  })

  it('marks the last item as in progress while the phase works: a note that says what it does, or a tool in use', () => {
    const doing = phaseItems(
      phase([note('finding', 'A.', '01:00'), note('doing', 'B.', '02:00')]),
      'user',
    )
    const tool = phaseItems(
      phase([note('doing', 'A.', '01:00'), note('tool', 'B.', '02:00', 'search')]),
      'user',
    )

    expect(doing.map((item) => item.type === 'note' && item.isInProgress)).toEqual([false, true])
    expect(tool[1]?.type === 'tool' && tool[1].use.isRunning).toBe(true)
  })

  it('marks nothing as in progress once the phase is done, or when its last note is a finding', () => {
    const done = phaseItems(phase([note('doing', 'A.', '01:00')], true), 'user')
    const found = phaseItems(
      phase([note('doing', 'A.', '01:00'), note('finding', 'B.', '02:00')]),
      'user',
    )

    expect(done[0]?.type === 'note' && done[0].isInProgress).toBe(false)
    expect(found.some((item) => item.type === 'note' && item.isInProgress)).toBe(false)
  })

  it('gives each tool item an id of its own', () => {
    const items = phaseItems(
      phase([
        note('tool', 'One.', '01:00', 'search'),
        note('finding', 'Found.', '02:00'),
        note('tool', 'Two.', '03:00', 'search'),
      ]),
      'user',
    )
    const ids = items.flatMap((item) => (item.type === 'tool' ? [item.use.id] : []))

    expect(new Set(ids).size).toBe(2)
  })

  it('leaves the reasoning of the model out of the user view and keeps it in the developer view', () => {
    const entry = phase([note('thinking', 'Hmm.', '01:00'), note('doing', 'A.', '02:00')])

    expect(phaseItems(entry, 'user')).toHaveLength(1)
    expect(phaseItems(entry, 'developer')).toHaveLength(2)
  })
})

describe('isPhaseOpenByDefault', () => {
  it.each([
    ['running', true],
    ['waiting', true],
    ['failed', true],
    ['stopped', true],
    ['done', false],
  ] as const)('is %s -> %s', (status, expected) => {
    expect(isPhaseOpenByDefault({ status })).toBe(expected)
  })
})
