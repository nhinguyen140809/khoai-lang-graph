import { describe, expect, it } from 'vitest'

import { isUnfinishedRunStatus } from '../run-status.utils'
import { unfinishedCases } from './run-status.utils.data'

describe('isUnfinishedRunStatus', () => {
  it.each(unfinishedCases)('tells whether a %s run has not ended: %s', (status, unfinished) => {
    expect(isUnfinishedRunStatus(status)).toBe(unfinished)
  })
})
