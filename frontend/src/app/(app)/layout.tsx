import type { ReactNode } from 'react'

import { AppShell } from '@/components/layout/AppShell'

interface AppLayoutProps {
  children: ReactNode
}

/** Routes in the (app) group render inside the app shell; the group name is not part of the URL. */
export default function AppLayout({ children }: AppLayoutProps) {
  return <AppShell>{children}</AppShell>
}
