import type { ReactNode } from 'react'

import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppShell } from '@/components/layout/AppShell'
import { ArtifactPanel } from '@/features/artifacts'
import { ThreadList } from '@/features/threads'

interface AppLayoutProps {
  children: ReactNode
}

/**
 * Routes in the (app) group render inside the app shell; the group name is not part of the URL.
 * The shell is a shared layout, so the feature components it shows are passed in from here.
 */
export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <AppShell
      sidebar={<AppSidebar groupItems={{ threads: <ThreadList /> }} />}
      artifactPanel={<ArtifactPanel />}
    >
      {children}
    </AppShell>
  )
}
