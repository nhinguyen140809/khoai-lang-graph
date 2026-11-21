import type { ReactNode } from 'react'

import { DeskProjectPagesProvider } from '@/modules/project/entities'
import { ProjectDialogs } from '@/modules/project/widgets/dialogs'
import { ProjectSidebar } from '@/modules/project/widgets/sidebar'
import { ViewGate } from '@/modules/user/features/view'
import { AccountCommands } from '@/modules/user/widgets/commands'
import { BarAccountMenu, SidebarAccountMenu } from '@/modules/user/widgets/menu'
import { Desk } from '@/shared/components/frame'
import { ViewProvider } from '@/shared/lib/view'
import { userRoutes } from '@/shared/routes'

// Pages are kept, hidden, when the user leaves them (Cache Components). The layout is allowed to
// block, as its pages are.
export const instant = false

interface UserLayoutProps {
  children: ReactNode
}

/**
 * The pages of the user view, which every host except `dev.` shows: the desk, once for every page,
 * so that it keeps its state from page to page, with the dialogs of the projects. The desk has the
 * projects and the account in a side list, or the account in the bar at the top, as its
 * arrangement says. A project opens on its chat.
 */
export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <ViewProvider value="user">
      <ViewGate />
      <AccountCommands />
      <DeskProjectPagesProvider>
        <Desk
          homeHref={userRoutes.home()}
          sidebar={<ProjectSidebar footer={<SidebarAccountMenu />} />}
          accountMenu={<BarAccountMenu />}
          contributions={<ProjectDialogs />}
        >
          {children}
        </Desk>
      </DeskProjectPagesProvider>
    </ViewProvider>
  )
}
