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

  it('anchors each line at the id of its first step', () => {
    const entries = workEntries([buildStep({ sequence: 7, agent_role: 'analyst' })], null)

    expect(entries[0]?.id).toBe('s7')
  })
})
