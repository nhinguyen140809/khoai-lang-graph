import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { useState } from 'react'

import { RouteError } from '@/components/RouteError'
import { routeTree } from '@/routeTree.gen'

export interface RouterContext {
  queryClient: QueryClient
}

function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultErrorComponent: RouteError,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}

/** Creates the router once, with the query client from <Providers> in its context. */
export function AppRouter() {
  const queryClient = useQueryClient()
  const [router] = useState(() => createAppRouter(queryClient))
  return <RouterProvider router={router} />
}
