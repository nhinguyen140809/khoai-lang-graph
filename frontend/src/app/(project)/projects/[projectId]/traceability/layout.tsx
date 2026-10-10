import { SidePanel } from '@/components/layout/SidePanel'
import { Workbench } from '@/components/layout/Workbench'
import { EmptyState } from '@/components/state'

export default async function Layout({
  children,
  params,
}: LayoutProps<'/projects/[projectId]/traceability'>) {
  const { projectId } = await params
  return (
    <Workbench
      projectId={projectId}
      feature="traceability"
      side={
        <SidePanel title="Traceability">
          <EmptyState title="Not built yet" size="compact" className="px-3" />
        </SidePanel>
      }
    >
      {children}
    </Workbench>
  )
}
