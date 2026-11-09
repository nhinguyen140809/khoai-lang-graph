import { type QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

import { projectIds } from '@/mocks/shared/db'
import { ProjectIdProvider } from '@/modules/project/entities'
import { TooltipProvider } from '@/shared/components/ui/tooltip'

import { createTestQueryClient } from './test-query-client.utils'

interface TestProvidersProps {
  children: ReactNode
  /** The query cache to use, to look at it in the test; each render gets its own when left out. */
  queryClient?: QueryClient
  /** The project of the screen the component sits in; the mentor project when left out. */
  projectId?: string
}

/**
 * The providers a component needs in a unit test, which `renderWithProviders` and
 * `renderHookWithProviders` give to what they render.
 * Each render gets its own query cache, and failed queries are not retried, and sits in the
 * screen of a project, as `ProjectGate` puts the screens of a project.
 */
export function TestProviders({
  children,
  queryClient: given,
  projectId = projectIds.mentor,
}: TestProvidersProps) {
  const [own] = useState(createTestQueryClient)
  const queryClient = given ?? own
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ProjectIdProvider projectId={projectId}>{children}</ProjectIdProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
