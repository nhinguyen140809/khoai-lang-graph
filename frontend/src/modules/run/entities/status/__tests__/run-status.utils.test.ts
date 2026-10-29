import { describe, expect, it } from 'vitest'

import { runStatusesByAttention } from '../run-status.constants'
import { runStatuses } from '../run-status.types'
import { isUnfinishedRunStatus, runStatusLabel } from '../run-status.utils'
import { labelCases, unfinishedCases } from './run-status.utils.data'

describe('isUnfinishedRunStatus', () => {
  it.each(unfinishedCases)('tells whether a %s run has not ended: %s', (status, unfinished) => {
    expect(isUnfinishedRunStatus(status)).toBe(unfinished)
  })
})

describe('runStatusesByAttention', () => {
  it('ranks every status of a run once', () => {
    expect(runStatusesByAttention.toSorted()).toEqual(runStatuses.toSorted())
  })
})

describe('runStatusLabel', () => {
  it.each(labelCases)('labels $name in each view', ({ status, label }) => {
    expect(runStatusLabel(status)).toEqual(label)
  })
})
