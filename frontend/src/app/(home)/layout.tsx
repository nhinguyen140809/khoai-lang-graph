import type { ReactNode } from 'react'

import { ActivityBar } from '@/components/layout/ActivityBar'
import { AppFrame } from '@/components/layout/AppFrame'
import { PageCrumb } from '@/components/layout/PageCrumb'
import { surfaceClassName } from '@/components/layout/surface.config'
import { TopBar } from '@/components/layout/TopBar'
import { UserMenu } from '@/features/account'
import { NewProjectDialog, ProjectCommands } from '@/features/projects'
import { ThemeSync } from '@/features/settings'
import { cn } from '@/lib/utils'

interface HomeLayoutProps {
  children: ReactNode
}

/** Screens outside a project: the frame with a disabled activity bar. */
export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <>
      <ThemeSync />
      <AppFrame
        topBar={<TopBar crumb={<PageCrumb />} />}
        activityBar={<ActivityBar user={<UserMenu />} />}
        commands={<ProjectCommands />}
        dialogs={<NewProjectDialog />}
      >
        <main className={cn(surfaceClassName, 'min-h-0 flex-1 overflow-auto')}>{children}</main>
      </AppFrame>
    </>
  )
}
