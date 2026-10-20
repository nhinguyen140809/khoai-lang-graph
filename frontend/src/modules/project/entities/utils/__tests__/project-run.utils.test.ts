import { describe, expect, it } from 'vitest'

import { shownRun } from '../project-run.utils'
import { shownRunCases } from './project-run.utils.data'

describe('shownRun', () => {
  it.each(shownRunCases)('shows the run of $name', ({ project, shown }) => {
    expect(shownRun(project)).toBe(shown)
  })
})
