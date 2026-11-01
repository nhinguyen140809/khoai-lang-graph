import type { ReactNode } from 'react'

import { UserMenu } from '@/features/account'
import { NewProjectDialog, ProjectCommands } from '@/features/projects'
import { settingsActivity, ThemeCommands, ThemeSync } from '@/features/settings'
import { type Activity, PageCrumb, PageWorkspace, Workbench } from '@/shared/components/frame'

interface HomeLayoutProps {
  children: ReactNode
}

/** The name of each screen on the top bar, by the start of its address. */
const pages = [
  { path: '/settings', name: 'Settings' },
  { path: '/projects', name: 'Projects' },
]

/** The features of the screens outside a project: the settings, at the bottom of the bar. */
const activities: Activity[] = [settingsActivity()]

/**
 * Screens outside a project: the frame, with the account menu and the settings on the activity
 * bar, and the side panel of the settings beside the page once it is chosen.
 */
export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <>
      <ThemeSync />
      <Workbench
        crumb={<PageCrumb pages={pages} fallback="Projects" />}
        account={<UserMenu />}
        activities={activities}
        contributions={
          <>
            <ProjectCommands />
            <ThemeCommands />
          </>
        }
        dialogs={<NewProjectDialog />}
      >
        <PageWorkspace>{children}</PageWorkspace>
      </Workbench>
    </>
  )
}
