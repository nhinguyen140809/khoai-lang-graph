import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'

import { AppShell } from '@/app/layout/AppShell'
import type { RouterContext } from '@/app/Router'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <p className="p-6">Page not found.</p>,
})

function RootLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
