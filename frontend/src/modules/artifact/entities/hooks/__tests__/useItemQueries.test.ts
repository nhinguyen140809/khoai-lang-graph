import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { act } from 'react'
import { describe, expect, it } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
  itemFixtures,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { server } from '@/mocks/msw-server.setup'
import { projectIds } from '@/mocks/shared/db'
import { apiBasePath, apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { pageItems } from '@/shared/api/query-client'
import { recordRequests, serverErrorOn } from '@/test/msw'
import { renderHookWithProviders } from '@/test/render'
import { waitForQueries, waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { itemsPageSize } from '../../page-sizes.constants'
import {
  useArtifactItems,
  useItem,
  useItemRevisions,
  useItemSchema,
  useProjectItems,
} from '../useItemQueries'

const projectId = projectIds.mentor
const specification = artifactFixtureByKind(projectId, 'requirement_specification')
const requirement = itemFixtureByKey(projectId, 'REQ-001')

describe('useArtifactItems', () => {
  it('loads the items of an artifact in outline order', async () => {
    const { result } = renderHookWithProviders(() => useArtifactItems(specification.id))

    await waitForSuccess(result)
    const items = pageItems(result.current.data)
    expect(items).toHaveLength(specification.item_count)
    expect(items[0]?.key).toBe('SEC-001')
  })
})

describe('useProjectItems', () => {
  it('loads the items of a project a page at a time', async () => {
    // The project must hold more items than a page, or there is no second page to load.
    const projectItems = itemFixtures.filter(({ project_id }) => project_id === projectId)
    expect(projectItems.length).toBeGreaterThan(itemsPageSize)
    const { result } = renderHookWithProviders(() => useProjectItems(projectId))

    await waitForSuccess(result)
    expect(result.current.hasNextPage).toBe(true)

    await act(async () => {
      await result.current.fetchNextPage()
    })

    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2)
    })
  })

  it('loads only the items that match the filters', async () => {
    const { result } = renderHookWithProviders(() =>
      useProjectItems(projectId, { text: 'REQ-001' }),
    )

    await waitForSuccess(result)
    expect(result.current.data?.pages[0]?.items.map(({ key }) => key)).toEqual(['REQ-001'])
  })
})

describe('useItem', () => {
  it('loads one item, and the same item at a version apart from it', async () => {
    const { result } = renderHookWithProviders(() => ({
      now: useItem(requirement.id),
      older: useItem(requirement.id, 1),
    }))

    await waitForQueries(() => [result.current.now, result.current.older])
    expect(result.current.now.data?.key).toBe('REQ-001')
    expect(result.current.older.data?.version).toBe(1)
  })
})

describe('useItemRevisions', () => {
  it('loads the versions of an item, newest first', async () => {
    const { result } = renderHookWithProviders(() => useItemRevisions(requirement.id))

    await waitForSuccess(result)
    expect(result.current.data?.pages[0]?.items[0]?.version).toBe(requirement.version)
  })
})

describe('useItemSchema', () => {
  it('gives the current schema of the kind of an item written with it', async () => {
    const requests = recordRequests()

    const { result } = renderHookWithProviders(() => useItemSchema(requirement))

    await waitFor(() => {
      expect(result.current.schema?.title).toBe('Requirement')
    })
    expect(result.current.isPending).toBe(false)
    expect(requests.some(({ path }) => path.startsWith(`${apiBasePath}/content-schemas`))).toBe(
      false,
    )
  })

  it('loads the schema of the version that an older item was written with', async () => {
    server.use(
      http.get(apiEndpoints.contentSchema.path({ kind: 'spec_requirement', version: '0' }), () =>
        HttpResponse.json({ title: 'Older requirement' }),
      ),
    )
    const older = { ...requirement, schema_version: 0 }

    const { result } = renderHookWithProviders(() => useItemSchema(older))

    await waitFor(() => {
      expect(result.current.schema?.title).toBe('Older requirement')
    })
    expect(result.current.isPending).toBe(false)
  })

  it('stops waiting and reports the failure when the kinds cannot be loaded', async () => {
    server.use(serverErrorOn(HttpMethod.Get, apiEndpoints.artifactKinds.path()))

    const { result } = renderHookWithProviders(() => useItemSchema(requirement))

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.isPending).toBe(false)
    expect(result.current.schema).toBeUndefined()
  })

  it('waits while there is no item', async () => {
    const { result } = renderHookWithProviders(() => useItemSchema(undefined))

    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })
    expect(result.current.schema).toBeUndefined()
  })
})

describe('enabling', () => {
  itWaitsUntilEnabled([
    {
      name: 'useArtifactItems',
      useHook: () => useArtifactItems(specification.id, {}, { isEnabled: false }),
    },
  ])
})
