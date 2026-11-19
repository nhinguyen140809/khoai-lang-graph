import { describe, expect, it } from 'vitest'

import type { ItemRef } from '@/modules/artifact/entities/@x/run'

import type { WorkStatus } from '../work.types'
import { workMoodOf } from '../work-status-look.utils'

const item = { id: 'item-1', version: 1 } as unknown as ItemRef

function workOf(status: WorkStatus, created: ItemRef[] = [], changed: ItemRef[] = []) {
  return { status, created, changed }
}

describe('workMoodOf', () => {
  it('thinks while a line runs and has not yet created or changed an item', () => {
    expect(workMoodOf(workOf('running'))).toBe('thinking')
  })

  it('works once a running line has created or changed an item', () => {
    expect(workMoodOf(workOf('running', [item]))).toBe('working')
    expect(workMoodOf(workOf('running', [], [item]))).toBe('working')
  })

  it('takes the mood of the status for a line that does not run', () => {
    expect(workMoodOf(workOf('waiting'))).toBe('waiting')
    expect(workMoodOf(workOf('failed'))).toBe('worried')
    expect(workMoodOf(workOf('stopped'))).toBe('sleepy')
    expect(workMoodOf(workOf('done'))).toBe('idle')
  })
})
