import { describe, expect, it } from 'vitest'

import { issuesWithSubjects } from '../issues.utils'
import { issueCases } from './issues.utils.data'

describe('issuesWithSubjects', () => {
  it.each(issueCases)('$name', ({ items, links, kinds, expected }) => {
    const groups = issuesWithSubjects(items, links, kinds)

    expect(
      groups.map(({ kind, entries }) => ({
        kind,
        issues: entries.map(({ issue, subjects }) => ({
          key: issue.key,
          subjects: subjects.map(({ key }) => key),
        })),
      })),
    ).toEqual(expected)
  })
})
