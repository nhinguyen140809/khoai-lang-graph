import type { ReactNode } from 'react'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

interface AppShellProps {
  sidebar: ReactNode
  artifactPanel: ReactNode
  children: ReactNode
}

/** Sidebar | chat / workflow | artifact panel (docs/PLANNING.md section 4, target layout). */
export function AppShell({ sidebar, artifactPanel, children }: AppShellProps) {
  return (
    <SidebarProvider>
      {sidebar}
      <SidebarInset className="h-svh">
        <header className="flex h-12 shrink-0 items-center border-b px-2">
          <SidebarTrigger />
        </header>
        <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
          <ResizablePanel defaultSize="60" minSize="30">
            <main className="h-full">{children}</main>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="40" minSize="20" collapsible>
            <aside className="h-full" aria-label="Artifacts">
              {artifactPanel}
            </aside>
          </ResizablePanel>
        </ResizablePanelGroup>
      </SidebarInset>
    </SidebarProvider>
  )
}
