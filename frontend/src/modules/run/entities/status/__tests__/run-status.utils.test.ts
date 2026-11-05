import { describe, expect, it } from 'vitest'

import { runStatusesByAttention } from '../run-status.constants'
import { runStatuses } from '../run-status.types'
import {
  hasStageName,
  isUnfinishedRunStatus,
  isWritingRunStatus,
  runStatusLabel,
} from '../run-status.utils'
import { hasStageNameCases, labelCases, unfinishedCases } from './run-status.utils.data'

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

describe('hasStageName', () => {
  it.each(hasStageNameCases)(
    'tells whether the label of a %s run names its stage: %s',
    (status, names) => {
      expect(hasStageName(status)).toBe(names)
    },
  )
})

describe('isWritingRunStatus', () => {
  it.each(runStatuses)('tells whether a %s run writes the documents', (status) => {
    expect(isWritingRunStatus(status)).toBe(status === 'running')
  })
})
