import type { ReactNode } from 'react'

import { ArtifactPanel } from '@/features/artifacts'
import { ThreadList } from '@/features/threads'
import { AppSidebar } from '@/shared/components/frame/app-sidebar'
import { AppShell } from '@/shared/components/frame/AppShell'

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
