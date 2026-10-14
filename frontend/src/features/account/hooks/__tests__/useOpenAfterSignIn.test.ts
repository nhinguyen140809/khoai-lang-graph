import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { routerMock } from '@/test/next-mocks.utils'

import { useOpenAfterSignIn } from '../useOpenAfterSignIn'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)

function renderWithCache(next: string | null) {
  const client = new QueryClient()
  client.setQueryData(['account', 'me'], { display_name: 'Someone else' })
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  const { result } = renderHook(() => useOpenAfterSignIn(next), { wrapper })
  return { client, open: result.current }
}

beforeEach(() => {
  routerMock.replace.mockClear()
})

describe('useOpenAfterSignIn', () => {
  it('drops the cached queries, then opens the page to return to', () => {
    const { client, open } = renderWithCache('/threads/t1')

    open()

    expect(client.getQueryCache().getAll()).toHaveLength(0)
    expect(routerMock.replace).toHaveBeenCalledWith('/threads/t1')
  })

  it('opens the project list when the page to return to is not of this app', () => {
    const { open } = renderWithCache('//example.com')

    open()

    expect(routerMock.replace).toHaveBeenCalledWith('/projects')
  })
})
