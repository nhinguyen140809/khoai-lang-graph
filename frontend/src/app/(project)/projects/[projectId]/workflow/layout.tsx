import { SidePanel } from '@/components/layout/SidePanel'
import { Workbench } from '@/components/layout/Workbench'
import { RunsPanel } from '@/features/workflow'

export default async function Layout({
  children,
  params,
}: LayoutProps<'/projects/[projectId]/workflow'>) {
  const { projectId } = await params
  return (
    <Workbench
      projectId={projectId}
      feature="workflow"
      side={
        <SidePanel title="Runs">
          <RunsPanel projectId={projectId} />
        </SidePanel>
      }
    >
      {children}
    </Workbench>
  )
}
