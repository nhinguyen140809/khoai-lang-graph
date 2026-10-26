import { expect, it } from 'vitest'

import { callApi, openPage } from '../../msw'
import type { RejectedRequestCase } from './mock-handler.types'

/**
 * Tests that the mock server refuses each request as the API does: the status, and the fields of
 * the body that the case names. A case can choose a scenario in the page address; the setup of
 * Vitest puts the address back after the test.
 */
export function itRejectsRequests(cases: readonly RejectedRequestCase[]) {
  it.each(cases)('$name', async ({ method, path, body, headers, page, status, answer }) => {
    if (page !== undefined) {
      openPage(page)
    }

    const answered = await callApi({ method, path, body, ...(headers && { headers }) })

    expect(answered).toMatchObject({ status, ...(answer !== undefined && { body: answer }) })
  })
}
