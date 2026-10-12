import type { ReactNode } from 'react'

import { PageCrumb, Workbench } from '@/components/layout'
import { Surface } from '@/components/ui/surface'
import { UserMenu } from '@/features/account'
import { NewProjectDialog, ProjectCommands } from '@/features/projects'
import { ThemeCommands, ThemeSync } from '@/features/settings'

interface HomeLayoutProps {
  children: ReactNode
}

/** The name of each screen on the top bar, by the start of its address. */
const pages = [
  { path: '/settings', name: 'Settings' },
  { path: '/projects', name: 'Projects' },
]

/**
 * Screens outside a project: the frame, with the account menu on the activity bar. They have no
 * feature yet; a feature shown outside a project would be passed to Workbench here as an activity.
 */
export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <>
      <ThemeSync />
      <Workbench
        crumb={<PageCrumb pages={pages} fallback="Projects" />}
        account={<UserMenu />}
        commands={
          <>
            <ProjectCommands />
            <ThemeCommands />
          </>
        }
        dialogs={<NewProjectDialog />}
      >
        <Surface as="main" className="min-h-0 flex-1">
          {children}
        </Surface>
      </Workbench>
    </>
  )
}
