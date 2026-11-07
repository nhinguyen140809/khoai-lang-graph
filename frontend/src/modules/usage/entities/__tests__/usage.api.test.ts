import { describe, expect, it } from 'vitest'

import { HttpStatus } from '@/shared/api/http'
import { itSendsRequests, itThrowsApiErrors } from '@/test/suites'

import { getMonthlyUsage } from '../usage.api'
import { apiErrorCases, sentRequestCases } from './usage.api.data'

describe('usage api', () => {
  it('reads the month of the mock data with its budget and no groups', async () => {
    const usage = await getMonthlyUsage()

    expect(usage.month).toBe('2026-10')
    expect(usage.budget_usd).toBe(20)
    expect(usage.total.cost_usd).toBeCloseTo(4.775, 6)
    expect(usage.groups).toEqual([])
  })

  it('reads the groups of an agent role, the one that cost most first', async () => {
    const usage = await getMonthlyUsage({ groupBy: 'agent_role' })

    expect(usage.groups).toHaveLength(8)
    expect(usage.groups[0]?.key).toBe('interviewer')
  })

  it('rejects a month that is not YYYY-MM', async () => {
    await expect(getMonthlyUsage({ month: '2026-13' })).rejects.toMatchObject({
      status: HttpStatus.BadRequest,
      code: 'invalid_request',
    })
  })

  itSendsRequests(sentRequestCases)

  itThrowsApiErrors(apiErrorCases)
})
