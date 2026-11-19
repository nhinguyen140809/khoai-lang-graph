import type { ReactNode } from 'react'

import { ViewGate } from '@/modules/user/features/view'
import { AccountCommands } from '@/modules/user/widgets/commands'
import { ViewProvider } from '@/shared/lib/view'

// Pages are kept, hidden, when the user leaves them (Cache Components). The layout is allowed to
// block, as its pages are.
export const instant = false

interface DeveloperLayoutProps {
  children: ReactNode
}

/** The pages of the developer view, which the host `dev.` shows: the workbench and its screens. */
export default function DeveloperLayout({ children }: DeveloperLayoutProps) {
  return (
    <ViewProvider value="developer">
      <ViewGate />
      <AccountCommands />
      {children}
    </ViewProvider>
  )
}
