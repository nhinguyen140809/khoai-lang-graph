import { describe, expect, it } from 'vitest'

import { projectName, unfinishedRunCount } from '../projects.utils'
import { projectNameCases, unfinishedRunCountCases } from './projects.utils.data'

describe('projectName', () => {
  it.each(projectNameCases)('shows $name', ({ project, shown }) => {
    expect(projectName(project)).toBe(shown)
  })
})

describe('unfinishedRunCount', () => {
  it.each(unfinishedRunCountCases)('counts $name', ({ counts, count }) => {
    expect(unfinishedRunCount({ unfinished_run_counts: counts })).toBe(count)
  })
})
