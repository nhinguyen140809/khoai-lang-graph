import { describe, expect, it } from 'vitest'

import { rollupRunStatus } from '../run-status-rollup.utils'
import { rollupCases } from './run-status-rollup.utils.data'

describe('rollupRunStatus', () => {
  it.each(rollupCases)('gives $name', ({ statuses, rollup }) => {
    expect(rollupRunStatus(statuses)).toBe(rollup)
  })
})
