import type { ReactNode } from 'react'

import { ViewProvider } from '@/shared/lib/view'

// Pages are kept, hidden, when the user leaves them (Cache Components). The layout is allowed to
// block, as its pages are.
export const instant = false

interface UserLayoutProps {
  children: ReactNode
}

/** The pages of the user view, which every host except `dev.` shows. */
export default function UserLayout({ children }: UserLayoutProps) {
  return <ViewProvider value="user">{children}</ViewProvider>
}
