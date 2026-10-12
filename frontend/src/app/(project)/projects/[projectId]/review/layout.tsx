import { SidePanel } from '@/components/layout/SidePanel'
import { Workbench } from '@/components/layout/Workbench'
import { ConsoleNavigator } from '@/features/console'
import { ThreadList } from '@/features/threads'

export default async function ReviewLayout({
  children,
  params,
}: LayoutProps<'/projects/[projectId]/review'>) {
  const { projectId } = await params
  return (
    <Workbench
      projectId={projectId}
      feature="console"
      side={
        <SidePanel title="Console">
          <ConsoleNavigator projectId={projectId} consoles={<ThreadList projectId={projectId} />} />
        </SidePanel>
      }
    >
      {children}
    </Workbench>
  )
}
