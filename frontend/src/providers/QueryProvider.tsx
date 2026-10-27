'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

import { createQueryClient } from '@/shared/api/query-client'
import { redirectToLogin } from '@/shared/routes'

interface QueryProviderProps {
  children: ReactNode
}

/**
 * One QueryClient per mount (not a module singleton), so each test render gets a fresh cache.
 * Read it with `useQueryClient()` from @tanstack/react-query.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => createQueryClient(redirectToLogin))
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
