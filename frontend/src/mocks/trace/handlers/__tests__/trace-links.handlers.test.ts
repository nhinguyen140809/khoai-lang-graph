import { describe, expect, it } from 'vitest'

import { getApi, getApiItems, openPage } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import {
  coveragePath,
  emptyLinksPath,
  matrixPath,
  traceLinkRejectedCases,
} from './trace-links.handlers.data'

describe('the trace link handlers', () => {
  itRejectsRequests(traceLinkRejectedCases)

  it('list no link in the empty scenario', async () => {
    openPage('/?mock-trace-links=empty')

    expect(await getApiItems(emptyLinksPath)).toEqual([])
  })

  it('answer the matrix with its columns and no row in the empty scenario', async () => {
    openPage('/?mock-traceability=empty')

    const matrix = await getApi<{ columns: unknown[]; rows: unknown[] }>(matrixPath)

    expect(matrix.columns.length).toBeGreaterThan(0)
    expect(matrix.rows).toEqual([])
  })

  it('names the gaps of the coverage in the words of the user', async () => {
    openPage('/')

    const coverage = await getApi<{
      gaps: { key: string; title: string; description: string }[]
    }>(coveragePath)

    expect(coverage.gaps.map(({ key, title }) => `${key}: ${title}`)).toEqual([
      'no_backlog_item: Requirements without a user story',
      'no_source: Requirements without a source',
      'needs_review: Links to check',
    ])
    for (const gap of coverage.gaps) {
      expect(gap.description).toMatch(/[.]$/)
    }
  })
})
