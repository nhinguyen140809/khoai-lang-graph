import type { ReactNode } from 'react'

import { DeskProjectPagesProvider } from '@/modules/project/entities'
import { ProjectDialogs } from '@/modules/project/widgets/dialogs'
import { ProjectSidebar } from '@/modules/project/widgets/sidebar'
import { ViewGate } from '@/modules/user/features/view'
import { AccountCommands } from '@/modules/user/widgets/commands'
import { SidebarAccountMenu } from '@/modules/user/widgets/menu'
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
 * so that the side list keeps its state from page to page, with the projects and the account in
 * the side list and the dialogs of the projects. A project opens on its chat.
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
          contributions={<ProjectDialogs />}
        >
          {children}
        </Desk>
      </DeskProjectPagesProvider>
    </ViewProvider>
  )
}
