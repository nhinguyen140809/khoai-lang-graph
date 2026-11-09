import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { openPage } from '@/test/msw'
import { renderHookWithProviders } from '@/test/render'

import { useItemChain, useTraceAttention } from '../useGraphQueries'

const projectId = projectIds.mentor

describe('useTraceAttention', () => {
  it('gives the attention of the items of the project', async () => {
    const { result } = renderHookWithProviders(() => useTraceAttention(projectId))

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    if (result.current.state !== 'success') throw new Error('The attention did not load')

    // An item of a gap of the coverage asks the user to act on it or to follow it, for a reason:
    // REQ-003 was built from an older version of AR-007.
    const outOfDate = itemFixtureByKey(projectId, 'REQ-003')
    const attention = result.current.attentionOf({
      id: outOfDate.id,
      kind: outOfDate.kind,
      review_status: outOfDate.review_status,
      content: outOfDate.content,
    })
    expect(['act', 'follow']).toContain(attention.level)
    expect(attention.reasons).toEqual([expect.stringContaining('changed')])
  })
})

describe('useItemChain', () => {
  it('reads the chain of an item as a graph, with its focus node', async () => {
    const item = itemFixtureByKey(projectId, 'AR-003')
    const { result } = renderHookWithProviders(() => useItemChain(projectId, item.id))

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    if (result.current.state !== 'success') throw new Error('The chain did not load')

    expect(result.current.focus.id).toBe(item.id)
    expect(result.current.focus.isFocus).toBe(true)
    // The chain reaches both walks: an interview message and a backlog item.
    const kinds = new Set(result.current.graph.nodes.map(({ kindTitle }) => kindTitle))
    expect(kinds.size).toBeGreaterThan(1)
    expect(result.current.graph.edges.length).toBeGreaterThan(0)
  })

  it('answers the error of the links the attention reads, with its way to try again', async () => {
    openPage('/?mock-trace-links=error')
    const { result } = renderHookWithProviders(() =>
      useItemChain(projectId, itemFixtureByKey(projectId, 'AR-003').id),
    )

    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
    if (result.current.state !== 'error') throw new Error('The chain did not fail')
    expect(result.current.retry).toBeTypeOf('function')
  })

  it('answers notFound for an item that does not exist', async () => {
    const { result } = renderHookWithProviders(() =>
      useItemChain(projectId, '00000000-0000-4000-8000-000000000000'),
    )

    await waitFor(() => {
      expect(result.current.state).toBe('notFound')
    })
  })
})
