import { describe, expect, it } from 'vitest'

import { runStatuses, runStatusesByAttention } from '../../constants/run-status.constants'
import { isUnfinishedRunStatus, rollupRunStatus, runStatusLabel } from '../run-status.utils'
import { labelCases, rollupCases, unfinishedCases } from './run-status.utils.data'

describe('isUnfinishedRunStatus', () => {
  it.each(unfinishedCases)('tells whether a %s run has not ended: %s', (status, unfinished) => {
    expect(isUnfinishedRunStatus(status)).toBe(unfinished)
  })
})

describe('rollupRunStatus', () => {
  it.each(rollupCases)('gives $name', ({ statuses, rollup }) => {
    expect(rollupRunStatus(statuses)).toBe(rollup)
  })

  it('ranks every status of a run once', () => {
    expect(runStatusesByAttention.toSorted()).toEqual(runStatuses.toSorted())
  })
})

describe('runStatusLabel', () => {
  it.each(labelCases)('labels $name in each view', ({ status, label }) => {
    expect(runStatusLabel(status)).toEqual(label)
  })
})
