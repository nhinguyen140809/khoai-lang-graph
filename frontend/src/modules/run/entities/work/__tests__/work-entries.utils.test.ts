import { describe, expect, it } from 'vitest'

import { buildStep } from '@/mocks/runs/fixtures/runs.fixtures'
import { assertPresent } from '@/shared/lib/guards'

import type { RunStatus } from '../../status/run-status.types'
import { workEntries } from '../work-entries.utils'
import { workEntryCases } from './work-entries.utils.data'

const runsOf: Record<'running' | 'interrupted' | 'succeeded' | 'failed' | 'cancelled', RunStatus> =
  {
    running: 'running',
    interrupted: 'interrupted',
    succeeded: 'succeeded',
    failed: 'failed',
    cancelled: 'cancelled',
  }

describe('workEntries', () => {
  it.each(workEntryCases)('makes the lines of $name', ({ steps, runStatus, lines }) => {
    const entries = workEntries(
      steps.map((fields) => buildStep(fields)),
      runStatus === null ? null : { status: runsOf[runStatus] },
    )

    expect(entries).toHaveLength(lines.length)
    entries.forEach((entry, index) => {
      const line = assertPresent(lines[index], 'the line of the case')
      expect(entry.status).toBe(line.status)
      if (line.iteration !== undefined) expect(entry.iteration).toBe(line.iteration)
      if (line.durationMs !== undefined) expect(entry.durationMs).toBe(line.durationMs)
      if (line.costUsd !== undefined) expect(entry.costUsd).toBe(line.costUsd)
      if (line.modelId !== undefined) expect(entry.modelId).toBe(line.modelId)
      if (line.error !== undefined) expect(entry.error).toBe(line.error)
      if (line.subjectKey !== undefined) expect(entry.subjectKey).toBe(line.subjectKey)
      if (line.created !== undefined)
        expect(entry.created.map(({ key }) => key)).toEqual(line.created)
      if (line.changed !== undefined)
        expect(entry.changed.map(({ key }) => key)).toEqual(line.changed)
    })
  })

  it('gives no line for a run without steps, whatever its status', () => {
    expect(workEntries([], { status: 'running' })).toEqual([])
  })

  it('joins the notes of the steps of a line, in the order the steps wrote them', () => {
    const note = (text: string, kind: 'doing' | 'finding') => ({
      kind,
      text,
      created_at: '2026-10-06T08:30:00Z',
    })
    const entries = workEntries(
      [
        buildStep({
          sequence: 1,
          agent_role: 'interviewer',
          subject_item_id: 'p1',
          notes: [note('First.', 'doing')],
        }),
        buildStep({
          sequence: 2,
          agent_role: 'interviewer',
          subject_item_id: 'p1',
          notes: [note('Second.', 'finding')],
        }),
      ],
      null,
    )

    expect(entries).toHaveLength(1)
    expect(entries[0]?.notes.map(({ text }) => text)).toEqual(['First.', 'Second.'])
  })

  it('anchors each line at the id of its first step', () => {
    const entries = workEntries([buildStep({ sequence: 7, agent_role: 'analyst' })], null)

    expect(entries[0]?.id).toBe('s7')
  })
})

describe('workEntries as phases', () => {
  const at = (clock: string) => `2026-10-06T10:${clock}Z`
  const step = (sequence: number, node: string, stage: string, fields = {}) =>
    buildStep({
      sequence,
      node,
      agent_role: node,
      stage,
      started_at: at(`0${String(sequence)}:00`),
      finished_at: at(`0${String(sequence)}:50`),
      ...fields,
    })

  it('joins the steps that follow one another in one stage into one phase, with the nodes it ran', () => {
    const phases = workEntries(
      [
        step(1, 'corpus_builder', 'research'),
        step(2, 'stakeholder_miner', 'research'),
        step(3, 'planner', 'planning'),
      ],
      { status: 'succeeded' },
    )

    expect(phases.map(({ nodes }) => nodes)).toEqual([
      ['corpus_builder', 'stakeholder_miner'],
      ['planner'],
    ])
    expect(phases[0]?.durationMs).toBe(110_000)
  })

  it('keeps each node once in the nodes of a phase that a node ran twice', () => {
    const [phase] = workEntries(
      [
        step(1, 'corpus_builder', 'research'),
        step(2, 'stakeholder_miner', 'research'),
        step(3, 'corpus_builder', 'research'),
      ],
      { status: 'succeeded' },
    )

    expect(phase?.nodes).toEqual(['corpus_builder', 'stakeholder_miner'])
  })

  it('makes a new phase for a stage that comes back later, or in another round', () => {
    const phases = workEntries(
      [
        step(1, 'planner', 'planning'),
        step(2, 'corpus_builder', 'research'),
        step(3, 'planner', 'planning'),
        step(4, 'planner', 'planning', { iteration: 1 }),
      ],
      { status: 'succeeded' },
    )

    expect(phases.map(({ stage, iteration }) => `${stage}:${String(iteration)}`)).toEqual([
      'planning:0',
      'research:0',
      'planning:0',
      'planning:1',
    ])
  })

  it('makes a phase for each subject of a stage', () => {
    const phases = workEntries(
      [
        step(1, 'interviewer', 'interviewing', { subject_item_id: 'p1' }),
        step(2, 'interviewer', 'interviewing', { subject_item_id: 'p2' }),
      ],
      { status: 'succeeded' },
    )

    expect(phases).toHaveLength(2)
  })
})
