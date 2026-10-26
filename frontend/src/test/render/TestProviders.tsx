import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

import { TooltipProvider } from '@/shared/components/ui/tooltip'

import { createTestQueryClient } from './test-query-client.utils'

interface TestProvidersProps {
  children: ReactNode
  /** The query cache to use, to look at it in the test; each render gets its own when left out. */
  queryClient?: QueryClient
}

/**
 * The providers a component needs in a unit test, which `renderWithProviders` and
 * `renderHookWithProviders` give to what they render.
 * Each render gets its own query cache, and failed queries are not retried.
 */
export function TestProviders({ children, queryClient: given }: TestProvidersProps) {
  const [own] = useState(createTestQueryClient)
  const queryClient = given ?? own
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  )
}
