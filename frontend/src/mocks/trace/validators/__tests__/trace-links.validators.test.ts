import { describe, expect, it } from 'vitest'

import { validateNewTraceLink } from '../trace-links.validators'
import { acceptedLinkCases, projectId, refusedLinkCases } from './trace-links.validators.data'

describe('validateNewTraceLink', () => {
  it.each(refusedLinkCases)('refuses $name', ({ body, fields }) => {
    const read = validateNewTraceLink(projectId, body)

    expect('problems' in read && read.problems.map(({ field }) => field).toSorted()).toEqual(
      fields.toSorted(),
    )
  })

  it.each(acceptedLinkCases)('takes $name', ({ body, link }) => {
    const read = validateNewTraceLink(projectId, body)

    expect('link' in read && read.link).toMatchObject(link)
  })
})
