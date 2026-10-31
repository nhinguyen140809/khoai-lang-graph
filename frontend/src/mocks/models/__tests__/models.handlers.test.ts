import { describe, expect, it } from 'vitest'

import type { ModelCatalogEntry } from '@/modules/llm-model/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { getApi, getApiItems, openPage } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import { rejectedCases } from './models.handlers.data'

const path = apiEndpoints.models.path()

describe('GET /models', () => {
  it('answers the six models', async () => {
    expect(await getApiItems<ModelCatalogEntry>(path)).toHaveLength(6)
  })

  it('pages the catalog with a cursor', async () => {
    const page = await getApi<{ items: ModelCatalogEntry[]; next_cursor: string | null }>(
      `${path}?limit=2`,
    )

    expect(page.items).toHaveLength(2)
    expect(page.next_cursor).toBe('2')
  })

  it('answers no model in the empty scenario', async () => {
    openPage('/?mock-models=empty')

    expect(await getApiItems<ModelCatalogEntry>(path)).toEqual([])
  })

  itRejectsRequests(rejectedCases)
})
