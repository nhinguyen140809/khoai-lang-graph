import { describe, expect, it } from 'vitest'

import { shownRun } from '../project-run-result.utils'
import { shownRunCases } from './project-run-result.utils.data'

describe('shownRun', () => {
  it.each(shownRunCases)('shows the run of $name', ({ project, shown }) => {
    expect(shownRun(project)).toBe(shown)
  })
})
