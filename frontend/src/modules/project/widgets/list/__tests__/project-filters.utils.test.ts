import { describe, expect, it } from 'vitest'

import { projectFiltersOf } from '../project-filters.utils'
import { projectFiltersCases } from './project-filters.utils.data'

describe('projectFiltersOf', () => {
  it.each(projectFiltersCases)('reads $name', ({ values, filters }) => {
    expect(projectFiltersOf(values)).toEqual(filters)
  })
})
