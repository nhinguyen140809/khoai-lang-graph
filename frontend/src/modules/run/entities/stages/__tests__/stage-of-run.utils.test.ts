import { describe, expect, it } from 'vitest'

import { stageOfRun } from '../stage-of-run.utils'

const run = { current_stage: 'persona_review' }

describe('stageOfRun', () => {
  it('is the stage of the step that runs now, not the one the run still names', () => {
    const steps = [
      { stage: 'persona_review', status: 'succeeded' as const },
      { stage: 'interviewing', status: 'running' as const },
    ]

    expect(stageOfRun(run, steps)).toBe('interviewing')
  })

  it('is the stage of the last step that runs when several do', () => {
    const steps = [
      { stage: 'research', status: 'running' as const },
      { stage: 'interviewing', status: 'running' as const },
    ]

    expect(stageOfRun(run, steps)).toBe('interviewing')
  })

  it('is the stage that the run names when no step runs, or the steps have not loaded', () => {
    expect(stageOfRun(run, [{ stage: 'research', status: 'succeeded' as const }])).toBe(
      'persona_review',
    )
    expect(stageOfRun(run, undefined)).toBe('persona_review')
  })
})
