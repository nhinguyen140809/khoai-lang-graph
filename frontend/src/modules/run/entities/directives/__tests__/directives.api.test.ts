import { describe, expect, it } from 'vitest'

import { runIds } from '@/mocks/shared/db'
import { itSendsRequests } from '@/test/suites'

import { listRunDirectives } from '../directives.api'
import { sentRequestCases } from './directives.api.data'

describe('listRunDirectives', () => {
  it('reads the directives of a run by the loop they start, each with its items', async () => {
    const { items } = await listRunDirectives(runIds.mentorMain1, null, 100)

    expect(items.map(({ kind, iteration }) => [kind, iteration])).toEqual([
      ['rework', 1],
      ['intent', 2],
    ])
    expect(items[0]?.items.map(({ role }) => role)).toEqual(['addressed_to', 'about'])
  })

  it('tells who issued each directive: a decision of the user, or a step', async () => {
    const { items } = await listRunDirectives(runIds.mentorMain1, null, 100)

    expect(
      items.map((item) => [item.human_decision_id !== null, item.issued_by_step_id !== null]),
    ).toEqual([
      [true, false],
      [false, true],
    ])
  })

  it('reads an empty page for a run without directives', async () => {
    await expect(listRunDirectives(runIds.mentorMain3, null, 100)).resolves.toMatchObject({
      items: [],
      next_cursor: null,
    })
  })

  it('throws for a run that does not exist', async () => {
    await expect(listRunDirectives('missing', null, 100)).rejects.toThrow('HTTP 404')
  })

  itSendsRequests(sentRequestCases)
})
