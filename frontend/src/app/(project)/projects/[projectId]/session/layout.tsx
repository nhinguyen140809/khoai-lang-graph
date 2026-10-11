import { SidePanel } from '@/components/layout/SidePanel'
import { Workbench } from '@/components/layout/Workbench'
import { SessionNavigator } from '@/features/session'
import { ThreadList } from '@/features/threads'

export default async function SessionLayout({
  children,
  params,
}: LayoutProps<'/projects/[projectId]/session'>) {
  const { projectId } = await params
  return (
    <Workbench
      projectId={projectId}
      feature="session"
      side={
        <SidePanel title="Session">
          <SessionNavigator projectId={projectId} sessions={<ThreadList projectId={projectId} />} />
        </SidePanel>
      }
    >
      {children}
    </Workbench>
  )
}
