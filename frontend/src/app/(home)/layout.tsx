import type { ReactNode } from 'react'

import { AccountMenuItem } from '@/features/account'
import { ProjectCommands, ProjectDialogs } from '@/features/projects'
import { PageCrumb, PageWorkspace, Workbench } from '@/shared/components/frame'
import { homePageFallback, homePageNames } from '@/shared/config/routes'

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
