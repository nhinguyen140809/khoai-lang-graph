import { describe, expect, it } from 'vitest'

import { buildStep } from '@/mocks/runs/fixtures/runs.fixtures'
import { assertPresent } from '@/shared/lib/guards'

import type { StepNote } from '../../steps/run-steps.types'
import { splitWork, workEntries } from '../work-entries.utils'

const at = (clock: string) => `2026-10-06T10:${clock}Z`

const note = (text: string, clock: string): StepNote => ({
  kind: 'finding',
  text,
  created_at: at(clock),
})

/** A step of the miner that reads three documents in 12 minutes and notes one thing for each. */
function minerLine(finishedAt: string | null = at('12:00')) {
  const [line] = workEntries(
    [
      buildStep({
        sequence: 1,
        agent_role: 'stakeholder_miner',
        stage: 'research',
        status: finishedAt === null ? 'running' : 'succeeded',
        started_at: at('00:00'),
        finished_at: finishedAt,
        notes: [note('First.', '03:00'), note('Second.', '04:00'), note('Third.', '11:30')],
      }),
    ],
    { status: finishedAt === null ? 'running' : 'succeeded' },
  )
  return assertPresent(line, 'the line of the miner')
}

const textsOf = (parts: { notes: StepNote[] }[]) =>
  parts.map(({ notes }) => notes.map(({ text }) => text))

describe('splitWork', () => {
  it('gives the line back whole when no time falls inside it', () => {
    const line = minerLine()

    expect(splitWork(line, [])).toEqual([line])
    expect(splitWork(line, [at('00:00'), at('12:00'), at('13:00')])).toEqual([line])
  })

  it('cuts the line where a message comes between its notes, as the miner reads document by document', () => {
    const parts = splitWork(minerLine(), [at('03:30'), at('04:30'), at('11:59')])

    expect(textsOf(parts)).toEqual([['First.'], ['Second.'], ['Third.']])
    expect(parts.map(({ continues }) => continues)).toEqual([false, true, true])
    // A part that continues begins with its first note, after the time that cut it.
    expect(parts.map(({ startedAt }) => startedAt)).toEqual([at('00:00'), at('04:00'), at('11:30')])
    expect(new Set(parts.map(({ id }) => id)).size).toBe(3)
    expect(parts[0]?.id).toBe('s1')
  })

  it('leaves the report that a step posts as it ends in its own place', () => {
    const parts = splitWork(minerLine(), [at('11:59')])

    expect(parts).toHaveLength(1)
  })

  it('makes one cut of two times with no note between them', () => {
    const parts = splitWork(minerLine(), [at('03:30'), at('03:45')])

    expect(textsOf(parts)).toEqual([['First.'], ['Second.', 'Third.']])
  })

  it('keeps what the step used and wrote only on its last part', () => {
    const [first, last] = splitWork(minerLine(), [at('03:30')])

    expect(first?.status).toBe('done')
    expect(first?.durationMs).toBeNull()
    expect(first?.steps).toEqual([])
    expect(last?.steps).toHaveLength(1)
    expect(last?.durationMs).toBe(720_000)
  })

  it('cuts a line that still runs even when nothing is noted after the message yet', () => {
    const parts = splitWork(minerLine(null), [at('11:45')])

    expect(textsOf(parts)).toEqual([['First.', 'Second.', 'Third.'], []])
    expect(parts.at(-1)?.status).toBe('running')
    expect(parts[0]?.status).toBe('done')
  })

  it('cuts at a message however the time is written', () => {
    const parts = splitWork(minerLine(), ['2026-10-06T10:03:30.000000+00:00'])

    expect(textsOf(parts)).toEqual([['First.'], ['Second.', 'Third.']])
  })
})
