import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { artifactFixtureByKind, itemFixtures } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { server } from '@/mocks/msw-server.setup'
import { projectIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import { renderHookWithProviders } from '@/test/render'

import { useOutlineItems } from '../useOutlineItems'

const specification = artifactFixtureByKind(projectIds.mentor, 'requirement_specification')

describe('useOutlineItems', () => {
  const pageOf = (items: unknown[], nextCursor: string | null) =>
    HttpResponse.json({ items, next_cursor: nextCursor })

  it('loads every page of the items and gives the kinds that draw them', async () => {
    const all = itemFixtures.filter(({ artifact_id }) => artifact_id === specification.id)
    const outline = all.map((item, index) => ({ ...item, depth: index + 1 }))
    server.use(
      http.get(apiEndpoints.artifactItems.pattern, ({ request }) =>
        new URL(request.url).searchParams.get('cursor') === null
          ? pageOf(outline.slice(0, 2), 'next')
          : pageOf(outline.slice(2), null),
      ),
    )
    const { result } = renderHookWithProviders(() => useOutlineItems(specification.id))

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    const loaded = result.current
    if (loaded.state !== 'success') throw new Error('The items did not load')
    expect(loaded.items).toHaveLength(all.length)
    expect(loaded.itemKinds).toEqual(['section', 'spec_requirement'])
    expect(loaded.kinds.get('spec_requirement')?.display).toBe('table')
  })

  it('leaves out the superseded items', async () => {
    const [first, second] = itemFixtures.filter(
      ({ artifact_id }) => artifact_id === specification.id,
    )
    server.use(
      http.get(apiEndpoints.artifactItems.pattern, () =>
        pageOf(
          [
            { ...first, depth: 1 },
            { ...second, depth: 1, review_status: 'superseded' },
          ],
          null,
        ),
      ),
    )
    const { result } = renderHookWithProviders(() => useOutlineItems(specification.id))

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    expect(result.current.state === 'success' && result.current.items).toHaveLength(1)
  })

  it('is pending while the items load', () => {
    const { result } = renderHookWithProviders(() => useOutlineItems(specification.id))

    expect(result.current.state).toBe('pending')
  })

  it('gives an error with a way to try again', async () => {
    server.use(serverErrorOn(HttpMethod.Get, apiEndpoints.artifactItems.pattern))
    const { result } = renderHookWithProviders(() => useOutlineItems(specification.id))

    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
    expect(result.current.state === 'error' && typeof result.current.retry).toBe('function')
  })

  it('gives the same result on a render that changes nothing', async () => {
    const { result, rerender } = renderHookWithProviders(() => useOutlineItems(specification.id))
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    const loaded = result.current

    rerender()

    expect(result.current).toBe(loaded)
  })
})
