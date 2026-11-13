import { describe, expect, it } from 'vitest'

import { buildStep } from '@/mocks/runs/fixtures/runs.fixtures'

import { retryableStep } from '../retry-run.utils'
import { runWith } from './retry-run.utils.data'

describe('retryableStep', () => {
  const steps = [
    buildStep({ sequence: 1 }),
    buildStep({ sequence: 2, status: 'failed' }),
    buildStep({ sequence: 3, status: 'failed' }),
  ]

  it('gives the first step that failed, once the run has ended', () => {
    expect(retryableStep(runWith('failed'), steps)?.sequence).toBe(2)
  })

  it.each(['queued', 'running', 'interrupted'] as const)(
    'gives none while the run is %s, since only one run works at a time',
    (status) => {
      expect(retryableStep(runWith(status), steps)).toBeNull()
    },
  )

  it('gives none when no step failed', () => {
    expect(retryableStep(runWith('succeeded'), [buildStep({ sequence: 1 })])).toBeNull()
  })
})
