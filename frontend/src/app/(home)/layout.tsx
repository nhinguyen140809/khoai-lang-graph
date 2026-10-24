import type { ReactNode } from 'react'

import { ProjectCommands } from '@/modules/project/widgets/commands'
import { ProjectDialogs } from '@/modules/project/widgets/dialogs'
import { AccountMenuItem } from '@/modules/user/widgets/menu'
import { PageCrumb, PageWorkspace, Workbench } from '@/shared/components/frame'
import { homePageFallback, homePageNames } from '@/shared/config/page-names'
import { routes } from '@/shared/routes'

interface HomeLayoutProps {
  children: ReactNode
}

/**
 * Screens outside a project: the frame, with the commands that open or create a project, the
 * dialogs of the projects and the account menu, and the page.
 */
export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <Workbench
      crumb={<PageCrumb pages={homePageNames} fallback={homePageFallback} />}
      homeHref={routes.home()}
      contributions={
        <>
          <ProjectCommands />
          <ProjectDialogs />
          <AccountMenuItem />
        </>
      }
    >
      <PageWorkspace>{children}</PageWorkspace>
    </Workbench>
  )
}
