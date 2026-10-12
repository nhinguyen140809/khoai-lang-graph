import type { ReactNode } from 'react'

import { ActivityBar, PageCrumb, TopBar, Workbench } from '@/components/layout'
import { Surface } from '@/components/ui/surface'
import { UserMenu } from '@/features/account'
import { NewProjectDialog, ProjectCommands } from '@/features/projects'
import { ThemeSync } from '@/features/settings'

interface HomeLayoutProps {
  children: ReactNode
}

/**
 * Screens outside a project: the frame, with the account menu on the activity bar. They have no
 * feature yet; a feature shown outside a project would be passed to Workbench here as an activity.
 */
export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <>
      <ThemeSync />
      <Workbench
        topBar={<TopBar crumb={<PageCrumb />} />}
        activityBar={<ActivityBar user={<UserMenu />} />}
        commands={<ProjectCommands />}
        dialogs={<NewProjectDialog />}
      >
        <Surface as="main" className="min-h-0 flex-1">
          {children}
        </Surface>
      </Workbench>
    </>
  )
}
