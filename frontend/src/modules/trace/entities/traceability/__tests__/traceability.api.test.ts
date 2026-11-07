import { describe, expect, it } from 'vitest'

import { itSendsRequests, itThrowsApiErrors } from '@/test/suites'

import { getTraceabilityCoverage, getTraceabilityMatrix } from '../traceability.api'
import { apiErrorCases, projectId, sentRequestCases } from './traceability.api.data'

describe('traceability api', () => {
  it('reads a row for each chain, with the items of the chain in the cells of their columns', async () => {
    const matrix = await getTraceabilityMatrix(projectId)

    const row = matrix.rows.find(({ cells }) => cells.spec_requirement?.[0]?.key === 'REQ-001')
    expect(matrix.columns.map(({ key }) => key)).toEqual([
      'backlog_item',
      'spec_requirement',
      'analyzed_requirement',
      'raw_requirement',
      'interview_message',
    ])
    expect(matrix.columns.map(({ title }) => title)).toEqual([
      'Backlog item',
      'Spec requirement',
      'Analyzed requirement',
      'Raw requirement / Latent need',
      'Interview message',
    ])
    expect(row?.cells.backlog_item?.[0]?.key).toBe('US-001')
    expect(row?.cells.analyzed_requirement?.[0]?.key).toBe('AR-001')
    expect(row?.cells.raw_requirement?.[0]?.key).toBe('RAW-001')
    expect(row?.cells.interview_message?.[0]?.key).toBe('PER-001#2')
  })

  it('reads the items that need attention by the reason', async () => {
    const coverage = await getTraceabilityCoverage(projectId)

    const keysOf = (gap: string) =>
      coverage.gaps.find(({ key }) => key === gap)?.items.map(({ key }) => key)
    expect(coverage.gaps.map(({ key }) => key)).toEqual([
      'no_backlog_item',
      'no_source',
      'needs_review',
    ])
    expect(keysOf('no_backlog_item')).toEqual(['REQ-007', 'REQ-008', 'REQ-009', 'REQ-010'])
    expect(keysOf('needs_review')).toContain('REQ-003')
  })

  itSendsRequests(sentRequestCases)

  itThrowsApiErrors(apiErrorCases)
})
