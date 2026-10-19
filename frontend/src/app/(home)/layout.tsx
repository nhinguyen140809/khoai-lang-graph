import type { ReactNode } from 'react'

import { ProjectCommands } from '@/modules/project/widgets/commands'
import { ProjectDialogs } from '@/modules/project/widgets/dialogs'
import { MonthlyBudgetItem } from '@/modules/usage/entities'
import { AccountMenuItem } from '@/modules/user/widgets/menu'
import { PageCrumb, PageWorkspace, Workbench } from '@/shared/components/frame'
import { homePageFallback, homePageNames, routes } from '@/shared/config/routes'

interface HomeLayoutProps {
  children: ReactNode
}

/**
 * Screens outside a project: the frame, with the commands that open or create a project, the
 * dialogs of the projects, the account menu and the budget of the month, and the page.
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
          <MonthlyBudgetItem />
        </>
      }
    >
      <PageWorkspace>{children}</PageWorkspace>
    </Workbench>
  )
}
