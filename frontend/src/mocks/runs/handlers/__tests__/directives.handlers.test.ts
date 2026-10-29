import { describe, expect, it } from 'vitest'

import type { Directive } from '@/modules/run/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import type { ListPage } from '@/shared/api/request'
import type { ApiAnswer } from '@/test/msw'
import { fetchApi, openPage } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import { runIds } from '../../../shared/db'
import { refusedDirectiveCases } from './directives.handlers.data'

const listDirectives = (runId: string) =>
  fetchApi(apiEndpoints.runDirectives.path({ runId })) as Promise<ApiAnswer<ListPage<Directive>>>

describe('GET /runs/{run_id}/directives', () => {
  it('answers the directives of a run by the loop they start', async () => {
    const { body } = await listDirectives(runIds.mentorMain1)

    expect(body.items.map(({ iteration }) => iteration)).toEqual([1, 2])
    expect(body.next_cursor).toBeNull()
  })

  it('answers a page without directives for a run that has none', async () => {
    const { body } = await listDirectives(runIds.mentorMain3)

    expect(body.items).toEqual([])
  })

  it('answers a page without directives in the empty scenario', async () => {
    openPage('/?mock-directives=empty')

    const { body } = await listDirectives(runIds.mentorMain1)

    expect(body.items).toEqual([])
  })
})

describe('errors', () => {
  itRejectsRequests(refusedDirectiveCases)
})
