import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { routerMock } from '@/test/next-mocks.utils'

import { useOpenAfterSignIn } from '../useOpenAfterSignIn'
import { returnCases } from './useOpenAfterSignIn.data'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)

function renderWithCache(next: string | null) {
  const client = new QueryClient()
  client.setQueryData(['user', 'me'], { display_name: 'Someone else' })
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  const { result } = renderHook(() => useOpenAfterSignIn(next), { wrapper })
  return { client, open: result.current }
}

beforeEach(() => {
  routerMock.replace.mockClear()
})

describe('useOpenAfterSignIn', () => {
  it.each(returnCases)(
    'drops the cached queries, then opens $opens for $next',
    ({ next, opens }) => {
      const { client, open } = renderWithCache(next)

      open()

      expect(client.getQueryCache().getAll()).toHaveLength(0)
      expect(routerMock.replace).toHaveBeenCalledExactlyOnceWith(opens)
    },
  )
})
