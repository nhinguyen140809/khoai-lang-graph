import { SidePanel } from '@/components/layout/SidePanel'
import { Workbench } from '@/components/layout/Workbench'
import { ThreadList } from '@/features/threads'

export default async function ChatLayout({
  children,
  params,
}: LayoutProps<'/projects/[projectId]/chat'>) {
  const { projectId } = await params
  return (
    <Workbench
      projectId={projectId}
      feature="chat"
      side={
        <SidePanel title="Threads">
          <ThreadList projectId={projectId} />
        </SidePanel>
      }
    >
      {children}
    </Workbench>
  )
}
