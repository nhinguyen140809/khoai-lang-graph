import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

import { TooltipProvider } from '@/shared/components/ui/tooltip'

interface TestProvidersProps {
  children: ReactNode
}

/**
 * The providers a component needs in a unit test: `render(<X />, { wrapper: TestProviders })`.
 * Each render gets its own query cache, and failed queries are not retried.
 */
export function TestProviders({ children }: TestProvidersProps) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  )
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  )
}
