import { SidePanel } from '@/components/layout/SidePanel'
import { Workbench } from '@/components/layout/Workbench'
import { EmptyState } from '@/components/state'

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
          <EmptyState title="Not built yet" size="compact" className="px-3" />
        </SidePanel>
      }
    >
      {children}
    </Workbench>
  )
}
