import { describe, expect, it } from 'vitest'

import { routerMock } from '@/test/next-stubs'
import { createTestQueryClient, renderHookWithProviders } from '@/test/render'

import { useRedirectAfterLogin } from '../useRedirectAfterLogin'
import { returnCases } from './useRedirectAfterLogin.data'

function renderWithCache(next: string | null) {
  const client = createTestQueryClient()
  client.setQueryData(['user', 'me'], { display_name: 'Someone else' })
  const { result } = renderHookWithProviders(() => useRedirectAfterLogin(next), {
    queryClient: client,
  })
  return { client, open: result.current }
}

describe('useRedirectAfterLogin', () => {
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
