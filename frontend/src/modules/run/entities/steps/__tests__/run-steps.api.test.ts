import { describe, expect, it } from 'vitest'

import { runIds } from '@/mocks/shared/db'
import { itSendsRequests } from '@/test/suites'

import { listRunSteps } from '../run-steps.api'
import { sentRequestCases } from './run-steps.api.data'

describe('listRunSteps', () => {
  it('reads the steps of a run in the order they ran, a page at a time', async () => {
    const first = await listRunSteps(runIds.mentorMain3, null, 50)
    const second = await listRunSteps(runIds.mentorMain3, first.next_cursor, 50)
    const sequences = [...first.items, ...second.items].map(({ sequence }) => sequence)

    expect(first.items).toHaveLength(50)
    expect(second.next_cursor).toBeNull()
    expect(sequences).toEqual(Array.from({ length: 67 }, (_, index) => index + 1))
  })

  it('throws for a run that does not exist', async () => {
    await expect(listRunSteps('missing', null, 50)).rejects.toThrow('HTTP 404')
  })

  itSendsRequests(sentRequestCases)
})
