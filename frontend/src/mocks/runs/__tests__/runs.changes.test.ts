import { describe, expect, it } from 'vitest'

import { projectIds, threadIds } from '../../shared/db'
import { allRuns } from '../lookup/runs.lookup'
import { addRun } from '../runs.changes'

const mentorThread = { threadId: threadIds.mentorMain, projectId: projectIds.mentor }
const newRun = {
  ...mentorThread,
  status: 'queued' as const,
  currentStage: 'planning',
  stepCount: 0,
  startedAt: '2026-10-28T08:00:00Z',
}

describe('addRun', () => {
  it('starts the next run of the thread, and keeps it', () => {
    const run = addRun(newRun)

    expect(run).toMatchObject({ number: 4, status: 'queued', retry_of_run_id: null })
    expect(allRuns().map(({ id }) => id)).toContain(run.id)
  })

  it('gives each run an id of its own', () => {
    expect(addRun(newRun).id).not.toBe(addRun(newRun).id)
  })

  it('names the run that it retries', () => {
    expect(addRun({ ...newRun, retryOfRunId: 'run-2' }).retry_of_run_id).toBe('run-2')
  })

  it('resolves the settings of the run from the request', () => {
    const run = addRun({
      ...newRun,
      override: { review_checkpoints: null, max_steps: 7, max_cost_usd: null, parameters: null },
    })

    expect(run.run_config.max_steps).toBe(7)
  })
})
